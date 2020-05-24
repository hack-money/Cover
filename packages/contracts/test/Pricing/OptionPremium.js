const { use, expect } = require('chai');
const { Interface } = require('ethers/utils');
const {
    solidity,
    createFixtureLoader,
} = require('ethereum-waffle');

const Options = require('../../artifacts/Options.json');
const { generalTestFixture } = require('../helpers/fixtures');
const { contextForOracleActivated } = require('../helpers/contexts');
const { calcPremiumOffChain } = require('./helpers');

const { provider } = waffle;

use(solidity);


const [liquidityProvider, optionsBuyer] = provider.getWallets();
const OptionsInterface = new Interface(Options.abi);

const loadFixture = createFixtureLoader(provider, [
    liquidityProvider,
    optionsBuyer,
]);

describe('Option premium', async () => {
    let oracle;
    let paymentToken;
    let poolToken;
    let optionsContract;
    let liquidityPool;

    const numPoolTokens = 2e12;
    const numPaymentTokens = 2e12;
    const priceDecimals = 1e8;

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({
            poolToken,
            paymentToken,
            optionsContract,
            oracle,
            liquidityPool,
        } = await loadFixture(generalTestFixture));

        // Give liquidityProvider tokens to buy deposit into pool
        await poolToken.mint(liquidityProvider.address, numPoolTokens);
        await poolToken.approve(liquidityPool.address, numPoolTokens);
        await liquidityPool.deposit(numPoolTokens);

        // Give optionsBuyer tokens to buy option with
        await paymentToken.mint(optionsBuyer.address, numPaymentTokens);
        await paymentToken
            .connect(optionsBuyer)
            .approve(optionsContract.address, numPaymentTokens);
    });

    contextForOracleActivated(provider, () => {
        it('should create in the money PUT option with correct premium', async () => {
            // Scenario - in the money PUT option
            const amount = 100e2;
            const optionType = 1; // putOption
            const strikePrice = 250 * priceDecimals;
            const duration = 86400; // 1 day ( = 60 * 60 * 24 seconds)
            const volatility = await optionsContract.getVolatility();

            await oracle.update();
            const amountPoolTokenOut = await oracle.consult(
                poolToken.address,
                amount
            );
            const currentPrice = (amountPoolTokenOut / amount) * priceDecimals;

            // calculate expected premium offchain
            const expectedPremium = calcPremiumOffChain(
                amount,
                currentPrice,
                strikePrice,
                duration,
                volatility,
                priceDecimals,
                optionType
            );

            // fast forward time by 24hrs. Note: this will represent a problem, as update called
            // everytime option created. Automate the calling of update() for once every 24hrs
            // in the contracts
            const tx = await optionsContract.create(
                duration,
                amount,
                strikePrice,
                1
            );

            const receipt = await tx.wait();
            const optionID = OptionsInterface.parseLog(
                receipt.logs[receipt.logs.length - 1]
            ).values.optionId;
            const { premium } = await optionsContract.options(optionID);

            expect(parseFloat(premium.toNumber().toPrecision(4))).to.equal(
                parseFloat(expectedPremium.toPrecision(4))
            );
        });
    });
});

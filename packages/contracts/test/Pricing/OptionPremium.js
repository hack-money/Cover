const { use, expect } = require('chai');
const { Interface } = require('ethers/utils');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');

const { VALID_DURATION } = require('../helpers/constants');

const Options = require('../../build/Options.json');
const { generalTestFixture } = require('../helpers/fixtures');
const { contextForOracleActivated } = require('../helpers/contexts');
const { calcPremiumOffChain } = require('./helpers');

use(solidity);

const provider = new MockProvider({ gasLimit: 9999999 });
const [liquidityProvider, optionsBuyer] = provider.getWallets();
const OptionsInterface = new Interface(Options.abi);

const loadFixture = createFixtureLoader(provider, [
    liquidityProvider,
    optionsBuyer,
]);

describe.only('Option premium', async () => {
    let oracle;
    let paymentToken;
    let poolToken;
    let optionsContract;
    let liquidityPool;

    const numPoolTokens = 2000;
    const numPaymentTokens = 2000;
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

    it('should store a created option with the correct premium', async () => {
        // setup
        const amount = 100;
        const putOption = true;
        const strikePrice = 200 * priceDecimals;
        const duration = VALID_DURATION.asSeconds();
        const volatility = 10;

        const amountPoolTokenOut = await oracle.consult(
            poolToken.address,
            amount
        );
        const currentPrice = amountPoolTokenOut / amount;

        // create the option - TODO
        const tx = await optionsContract.create(
            duration,
            amount,
            strikePrice,
            putOption
        );

        const receipt = await tx.wait();
        const optionID = OptionsInterface.parseLog(
            receipt.logs[receipt.logs.length - 1]
        ).values.optionId;
        const { premium } = await optionsContract.options(optionID);
        console.log({ premium });

        // calculate expected premium offchain
        const expectedPremium = calcPremiumOffChain(
            amount,
            currentPrice,
            strikePrice,
            duration,
            volatility,
            priceDecimals,
            putOption
        );
        expect(premium).to.equal(expectedPremium);
    });
});

const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');
const { bigNumberify, Interface } = require('ethers/utils');
const { generalTestFixture } = require('../helpers/fixtures');

const Options = require('../../build/Options.json');
const { VALID_DURATION } = require('../helpers/constants');
const {calcFeeOffChain, calcPremiumOffChain } = require('../Pricing/helpers');
const { contextForOptionHasActivated, contextForOracleActivated } = require('../helpers/contexts');


use(solidity);

describe('Exchange token, via Uniswap', async () => {
    let poolToken;
    let paymentToken;
    let liquidityPool;
    let optionsContract;
    const numPoolTokens = 2000;
    const numPaymentTokens = 2000;
    const provider = new MockProvider({ gasLimit: 9999999 });

    const [liquidityProvider, optionsBuyer] = provider.getWallets();

    const loadFixture = createFixtureLoader(provider, [
        liquidityProvider,
        optionsBuyer,
    ]);

    const OptionsInterface = new Interface(Options.abi);

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({
            liquidityPool,
            optionsContract,
            poolToken,
            paymentToken,
            oracle,
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

    describe('buyOption', async () => {
        contextForOracleActivated(provider, () => {
            it('should exchange tokens when option is created', async () => {
                // setup
                const priceDecimals = 1e8;
                const optionId = bigNumberify(0);
                const duration = VALID_DURATION.asSeconds();
                const amount = 20;
                const optionType = 1; // putOption
                const volatility = await optionsContract.getVolatility();
                const strikePrice = 103000000;

                await oracle.update();
                const amountOutForAmount = await oracle.consult(
                    poolToken.address,
                    amount
                );
                const currentPrice =
                    (amountOutForAmount / amount) * priceDecimals;

                // calculate fees + premiums
                const platformFeePercentage = 10000;
                const expectedFee =
                    calcFeeOffChain(amount, platformFeePercentage) *
                    (currentPrice / priceDecimals);

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

                // expected exchangeToken variables
                const amountOutForPremium = await oracle.consult(
                    paymentToken.address,
                    parseInt(expectedPremium)
                );

                const initialPoolBalance = await liquidityPool.getPoolERC20Balance();

                const tx = await optionsContract.createATM(duration, amount, 1);
                const receipt = await tx.wait();
                const eventLog = OptionsInterface.parseLog(
                    receipt.logs[receipt.logs.length - 2]
                );

                const recoveredOptionId = eventLog.values.optionId;
                const recoveredPaymentToken = eventLog.values.paymentToken;
                const recoveredInputAmount = eventLog.values.inputAmount;
                const recoveredPoolToken = eventLog.values.poolToken;
                const recoveredOutputAmount = eventLog.values.outputAmount;

                expect(recoveredOptionId).to.equal(optionId);
                expect(recoveredPaymentToken).to.equal(paymentToken.address);
                expect(recoveredPoolToken).to.equal(poolToken.address);
                expect(recoveredInputAmount.toNumber().toPrecision(3)).to.equal(expectedPremium.toPrecision(3));
                expect(recoveredOutputAmount.toNumber().toPrecision(1)).to.equal(amountOutForPremium.toNumber().toPrecision(1));

                const finalPoolBalance = await liquidityPool.getPoolERC20Balance();

                // TODO: work out how to predict
                expect(finalPoolBalance).to.equal(
                    initialPoolBalance.add(bigNumberify(recoveredOutputAmount))
                );
            });
        });
    });

    describe('exerciseOption', async () => {
        let optionID;
        let optionValue;

        beforeEach(async () => {
            optionValue = 100;
            const tx = await optionsContract.createATM(
                VALID_DURATION.asSeconds(),
                optionValue,
                1
            );
            // Extract optionID from emitted event.
            const receipt = await tx.wait();
            optionID = OptionsInterface.parseLog(
                receipt.logs[receipt.logs.length - 1]
            ).values.optionId;
        });

        contextForOptionHasActivated(provider, function () {
            it('should exchange tokens when an option is exercised', async () => {
                // Note: This test doesn't generalise to put options. See comment on last `expect`
                const [
                    ,
                    ,
                    strikeAmount,
                    amount,
                    ,
                    ,
                    ,
                ] = await optionsContract.getOptionInfo(optionID);

                const initialPoolBalance = await liquidityPool.getPoolERC20Balance();

                await expect(optionsContract.exercise(optionID))
                    .to.emit(optionsContract, 'Exchange')
                    .withArgs(
                        optionID,
                        paymentToken.address,
                        strikeAmount,
                        poolToken.address,
                        51 // TODO: generalise/calculate this expected output
                    )
                    .to.emit(optionsContract, 'Exercise')
                    .withArgs(optionID, optionValue);

                const finalPoolBalance = await liquidityPool.getPoolERC20Balance();

                // Note: finalPoolBalance = initialPoolBalance + uniswap output - funds released to option holder
                // For call options this is option.amount but for put options this is option.strikeAmount
                expect(finalPoolBalance).to.equal(
                    initialPoolBalance.add(51).sub(amount)
                );
            });
        });
    });
});

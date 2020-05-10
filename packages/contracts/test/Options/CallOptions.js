const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');
const { bigNumberify, Interface } = require('ethers/utils');

const {
    MIN_DURATION,
    MAX_DURATION,
    VALID_DURATION,
    ACTIVATION_DELAY,
} = require('../helpers/constants');

const CallOptions = require('../../build/CallOptions.json');
const { generalTestFixture } = require('../shared/fixtures');

const {
    contextForSpecificTime,
    contextForOptionHasActivated,
    contextForOptionHasExpired,
} = require('../helpers/contexts');

use(solidity);

describe('CallOptions functionality', async () => {
    let poolToken;
    let paymentToken;
    let liquidityPool;
    let optionsContract;
    const numPoolTokens = 2000;
    const numPaymentTokens = 2000;

    const provider = new MockProvider({ gasLimit: 9999999 });
    const [liquidityProvider, optionsBuyer] = provider.getWallets();
    const OptionsInterface = new Interface(CallOptions.abi);

    const loadFixture = createFixtureLoader(provider, [
        liquidityProvider,
        optionsBuyer,
    ]);

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({
            liquidityPool,
            optionsContract,
            poolToken,
            paymentToken,
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

    it("should own it's pool", async () => {
        const owner = await liquidityPool.owner();
        expect(owner).to.equal(optionsContract.address);
    });

    describe('buyOption', () => {
        it('reject options resulting in zero payout to buyer', async () => {
            await expect(optionsContract.create(0, 0)).to.be.revertedWith(
                'Amount is too small'
            );
        });

        // it("reject options where liquidity pool doesn't receive assets", async () => {
        //   await expect(optionsContract.create(86401, 1)).to.be.revertedWith('Premium is too small')
        // })

        it('reject options below minimum duration', async () => {
            const invalidDuration = MIN_DURATION.subtract({
                seconds: 1,
            }).asSeconds();
            await expect(
                optionsContract.create(invalidDuration, 1000)
            ).to.be.revertedWith('Duration is too short');
        });

        it('reject options above maximum duration', async () => {
            const invalidDuration = MAX_DURATION.add({
                seconds: 1,
            }).asSeconds();
            await expect(
                optionsContract.create(invalidDuration, 1000)
            ).to.be.revertedWith('Duration is too long');
        });

        it('stores a new option', async () => {
            const amount = 100;
            const tx = await optionsContract.create(
                VALID_DURATION.asSeconds(),
                amount
            );

            // Extract optionID from emitted event.
            const receipt = await tx.wait();
            const optionID = OptionsInterface.parseLog(
                receipt.logs[receipt.logs.length - 1]
            ).values.optionId;
            const option = await optionsContract.options(optionID);

            expect(option.state).to.equal(0);
            expect(option.holder).to.equal(optionsBuyer.address);
            expect(option.strikeAmount).to.equal(103);
            expect(option.amount).to.equal(amount);

            const { timestamp } = await provider.getBlock(receipt.blockHash);
            const expectedStart = bigNumberify(timestamp).add(
                ACTIVATION_DELAY.asSeconds()
            );
            const expectedExpiration = bigNumberify(timestamp).add(
                VALID_DURATION.asSeconds()
            );
            expect(expectedStart).to.equal(option.startTime);
            expect(expectedExpiration).to.equal(option.expirationTime);
        });

        it('emits a Create event', async () => {
            await expect(optionsContract.create(VALID_DURATION.asSeconds(), 20))
                .to.emit(optionsContract, 'Create')
                .withArgs(0, optionsBuyer.address, 0, 10);
        });
    });

    describe('exercise', () => {
        let optionID;

        beforeEach(async () => {
            const amount = 100;
            const tx = await optionsContract.create(
                VALID_DURATION.asSeconds(),
                amount
            );
            // Extract optionID from emitted event.
            const receipt = await tx.wait();
            optionID = OptionsInterface.parseLog(
                receipt.logs[receipt.logs.length - 1]
            ).values.optionId;
        });

        it('reject unactivated options', async () => {
            await expect(optionsContract.exercise(optionID)).to.be.revertedWith(
                'Option has not been activated yet'
            );
        });

        contextForOptionHasActivated(provider, function () {
            it('reject exercise by non-owner', async () => {
                await expect(
                    optionsContract
                        .connect(liquidityProvider)
                        .exercise(optionID)
                ).to.be.revertedWith('Wrong msg.sender');
            });

            // it("reject non-active option", async () => {
            //   await expect(optionsContract.exercise(optionID)).to.be.revertedWith("Can't exercise inactive option")
            // })
        });

        contextForOptionHasExpired(provider, function () {
            it('reject option past expiry', async () => {
                await expect(
                    optionsContract.exercise(optionID)
                ).to.be.revertedWith('Option has expired');
            });
        });
    });

    describe('unlock/unlockMany', () => {
        let optionID1;
        let optionID2;

        beforeEach(async () => {
            const amount = 100;
            // console.log(optionsContract.interface.events.)

            // subtract mutates duration so we make a clone
            const tx1 = await optionsContract.create(
                VALID_DURATION.clone().subtract({ days: 2 }).asSeconds(),
                amount
            );
            const receipt1 = await tx1.wait();
            optionID1 = OptionsInterface.parseLog(
                receipt1.logs[receipt1.logs.length - 1]
            ).values.optionId;

            const tx2 = await optionsContract.create(
                VALID_DURATION.asSeconds(),
                amount
            );
            const receipt2 = await tx2.wait();
            optionID2 = OptionsInterface.parseLog(
                receipt2.logs[receipt2.logs.length - 1]
            ).values.optionId;
        });

        contextForOptionHasActivated(provider, function () {
            it('reject unlocking unexpired option', async () => {
                await expect(
                    optionsContract.unlock(optionID1)
                ).to.be.revertedWith('Option has not expired yet');
            });
        });

        contextForSpecificTime(
            'when there is a mix of expired and active options',
            VALID_DURATION.clone().subtract({ days: 1 }).asSeconds(),
            provider,
            function () {
                it('reject unlocking list of options including unexpired option', async () => {
                    await expect(
                        optionsContract.unlockMany([optionID1, optionID2])
                    ).to.be.revertedWith('Option has not expired yet');
                });
            }
        );

        contextForOptionHasExpired(provider, function () {
            it('emits an Expire event', async () => {
                await expect(optionsContract.unlock(optionID1))
                    .to.emit(optionsContract, 'Expire')
                    .withArgs(optionID1);
            });

            it('marks option as expired', async () => {
                await optionsContract.unlock(optionID1);
                const option = await optionsContract.options(optionID1);
                expect(option.state).to.equal(2);
            });

            it('can cancel multiple options', async () => {
                await optionsContract.unlockMany([optionID1, optionID2]);
                const option1 = await optionsContract.options(optionID1);
                const option2 = await optionsContract.options(optionID2);
                expect(option1.state).to.equal(2);
                expect(option2.state).to.equal(2);
            });
        });
    });
});

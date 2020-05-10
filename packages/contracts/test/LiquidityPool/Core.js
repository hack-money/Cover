const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');
const { bigNumberify } = require('ethers/utils');

const { generalTestFixture } = require('../helpers/fixtures');
const { calculateLPTokenDelta } = require('../helpers/calculateLPTokenDelta');

use(solidity);

describe('Core liquidity pool functionality', async () => {
    let poolToken;
    let liquidityPool;
    const numPoolTokens = 20;
    const provider = new MockProvider({ gasLimit: 9999999 });
    const [liquidityProvider, optionsBuyer] = provider.getWallets();

    const loadFixture = createFixtureLoader(provider, [
        liquidityProvider,
        optionsBuyer,
    ]);

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({ liquidityPool, poolToken } = await loadFixture(generalTestFixture));

        // Give liquidityProvider tokens to buy deposit into pool
        await poolToken.mint(liquidityProvider.address, numPoolTokens);
        await poolToken.approve(liquidityPool.address, numPoolTokens);
    });

    it('should set linked ERC20 token', async () => {
        const linkedToken = await liquidityPool.linkedToken();
        expect(linkedToken).to.equal(poolToken.address);
    });

    describe('deposit', () => {
        const deposit = 10;

        describe('initial deposit', () => {
            const initialDepositLPMultiplier = 1000;

            it('should start with a balance of zero', async () => {
                const liquidityPoolInitialBalance = await liquidityPool.getPoolERC20Balance();
                expect(liquidityPoolInitialBalance).to.equal('0');

                const liquidityPoolInitialSupply = await liquidityPool.totalSupply();
                expect(liquidityPoolInitialSupply).to.equal('0');
            });

            it('should reject zero deposit', async () => {
                await expect(liquidityPool.deposit('0')).to.be.revertedWith(
                    'Pool/can not deposit 0'
                );
            });

            it('should add liquidity to the pool', async () => {
                const userPreDepositBalance = await poolToken.balanceOf(
                    liquidityProvider.address
                );

                await liquidityPool.deposit(deposit);

                const userPostDepositBalance = await poolToken.balanceOf(
                    liquidityProvider.address
                );

                expect(userPostDepositBalance).to.equal(
                    userPreDepositBalance.sub(deposit)
                );

                const liquidityPoolFinalBalance = await liquidityPool.getPoolERC20Balance();
                expect(liquidityPoolFinalBalance).to.equal(deposit);
            });

            it('should mint appropriate number of LP tokens on liquidity addition', async () => {
                const initialUserTokenNum = await liquidityPool.getUserLPBalance(
                    liquidityProvider.address
                );
                expect(initialUserTokenNum).to.equal(0);

                await liquidityPool.deposit(deposit);
                const finalUserTokenNum = await liquidityPool.getUserLPBalance(
                    liquidityProvider.address
                );

                expect(finalUserTokenNum).to.equal(
                    deposit * initialDepositLPMultiplier
                );
            });
        });

        describe('normal deposit', () => {
            beforeEach(async () => {
                await liquidityPool.deposit(deposit);
            });

            it('should reject zero deposit', async () => {
                await expect(liquidityPool.deposit('0')).to.be.revertedWith(
                    'Pool/can not deposit 0'
                );
            });

            it('should add liquidity to the pool', async () => {
                const liquidityPoolInitialBalance = await liquidityPool.getPoolERC20Balance();

                const userPreDepositBalance = await poolToken.balanceOf(
                    liquidityProvider.address
                );

                await liquidityPool.deposit(deposit);

                const userPostDepositBalance = await poolToken.balanceOf(
                    liquidityProvider.address
                );
                expect(userPostDepositBalance).to.equal(
                    userPreDepositBalance.sub(deposit)
                );

                const liquidityPoolFinalBalance = await liquidityPool.getPoolERC20Balance();
                expect(liquidityPoolFinalBalance).to.equal(
                    bigNumberify(liquidityPoolInitialBalance).add(deposit)
                );
            });

            it('should mint appropriate number of LP tokens on liquidity addition', async () => {
                const initialUserTokenNum = await liquidityPool.getUserLPBalance(
                    liquidityProvider.address
                );

                await liquidityPool.deposit(deposit);
                const finalUserTokenNum = await liquidityPool.getUserLPBalance(
                    liquidityProvider.address
                );

                const poolERC20Balance = await liquidityPool.getPoolERC20Balance();
                const poolTotalSupply = await liquidityPool.totalSupply();

                const expectedTokenNum = calculateLPTokenDelta(
                    deposit,
                    poolERC20Balance,
                    poolTotalSupply
                );
                expect(finalUserTokenNum).to.equal(
                    bigNumberify(initialUserTokenNum).add(expectedTokenNum)
                );
            });
        });
    });

    describe('withdraw', () => {
        const withdraw = 3;

        beforeEach(async () => {
            const deposit = 10;
            await liquidityPool.deposit(deposit);
        });

        it('should reject zero withdrawal', async () => {
            await expect(liquidityPool.withdraw('0')).to.be.revertedWith(
                'Pool/can not withdraw 0'
            );
        });

        it('should withdraw liquidity from the pool', async () => {
            const userPreWithdrawBalance = await poolToken.balanceOf(
                liquidityProvider.address
            );
            const liquidityPoolBalancePreWithdraw = await liquidityPool.getPoolERC20Balance();

            await liquidityPool.withdraw(withdraw);

            const userPostWithdrawBalance = await poolToken.balanceOf(
                liquidityProvider.address
            );
            expect(userPostWithdrawBalance).to.equal(
                bigNumberify(userPreWithdrawBalance).add(withdraw)
            );

            const liquidityPoolBalancePostWithdraw = await liquidityPool.getPoolERC20Balance();
            expect(liquidityPoolBalancePostWithdraw).to.equal(
                liquidityPoolBalancePreWithdraw - withdraw
            );
        });

        it('should burn appropriate number of LP tokens on liquidity withdraw', async () => {
            const userLPTokenNumPreWithdraw = await liquidityPool.getUserLPBalance(
                liquidityProvider.address
            );

            await liquidityPool.withdraw(withdraw);

            const userLPTokenNumPostWithdraw = await liquidityPool.getUserLPBalance(
                liquidityProvider.address
            );

            const poolERC20Balance = await liquidityPool.getPoolERC20Balance();
            const poolTotalSupply = await liquidityPool.totalSupply();

            const expectedTokenDelta = calculateLPTokenDelta(
                withdraw,
                poolERC20Balance,
                poolTotalSupply
            );

            expect(userLPTokenNumPostWithdraw).to.equal(
                userLPTokenNumPreWithdraw - expectedTokenDelta
            );
        });
    });
});

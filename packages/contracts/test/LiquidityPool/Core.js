const { use, expect } = require('chai');
const { solidity, MockProvider } = require('ethereum-waffle');
const { bigNumberify } = require('ethers/utils');

const LiquidityPool = require('../../build/LiquidityPool.json');
const ERC20Mintable = require('../../build/ERC20Mintable.json');
const { calculateLPTokenDelta } = require('../helpers/calculateLPTokenDelta');
const { deployTestContract } = require('../helpers/deployTestContract');

use(solidity);

describe('Core liquidity pool functionality', async () => {
    let liquidityPool;
    let erc20;
    const numUserTokens = 20;
    const provider = new MockProvider({gasLimit: 9999999});
    const [user] = provider.getWallets();

    beforeEach(async () => {
        erc20 = await deployTestContract(user, ERC20Mintable);
        liquidityPool = await deployTestContract(user, LiquidityPool, [erc20.address]);

        await erc20.mint(user.address, numUserTokens);
        await erc20.approve(liquidityPool.address, numUserTokens);
    })

    it('should set owner of pool', async () => {
        const owner = await liquidityPool.owner();
        expect(owner).to.equal(user.address);
    })

    it('should set linked ERC20 token', async () => {
        const linkedToken = await liquidityPool.linkedToken();
        expect(linkedToken).to.equal(erc20.address);
    })

    describe('deposit', () => {
        const deposit = 10;

        describe('initial deposit', () => {
            const initialDepositLPMultiplier = 1000

            it('should start with a balance of zero', async () => {
                const liquidityPoolInitialBalance = await liquidityPool.getPoolERC20Balance();
                expect(liquidityPoolInitialBalance).to.equal("0");

                const liquidityPoolInitialSupply = await liquidityPool.totalSupply();
                expect(liquidityPoolInitialSupply).to.equal("0");
            })


            it('should reject zero deposit', async () => {
                await expect(liquidityPool.deposit("0")).to.be.revertedWith('Pool/can not deposit 0')
            })

            it('should add liquidity to the pool', async () => {
                const userPreDepositBalance = await erc20.balanceOf(user.address);
                expect(userPreDepositBalance).to.equal(numUserTokens);
        
                await liquidityPool.deposit(deposit);
        
                const userPostDepositBalance = await erc20.balanceOf(user.address);
                expect(userPostDepositBalance).to.equal(userPreDepositBalance - deposit);
        
                const liquidityPoolFinalBalance = await liquidityPool.getPoolERC20Balance();
                expect(liquidityPoolFinalBalance).to.equal(deposit);
            })

            it('should mint appropriate number of LP tokens on liquidity addition', async () => {
                const initialUserTokenNum = await liquidityPool.getUserLPBalance(
                    user.address
                );
                expect(initialUserTokenNum).to.equal(0);
        
                await liquidityPool.deposit(deposit);
                const finalUserTokenNum = await liquidityPool.getUserLPBalance(
                    user.address
                );
    
                expect(finalUserTokenNum).to.equal(deposit * initialDepositLPMultiplier);
            })
        })

        describe('normal deposit', () => {

            beforeEach(async () => {
                await liquidityPool.deposit(deposit);
            })

            it('should reject zero deposit', async () => {
                await expect(liquidityPool.deposit("0")).to.be.revertedWith('Pool/can not deposit 0')
            })

            it('should add liquidity to the pool', async () => {
                const liquidityPoolInitialBalance = await liquidityPool.getPoolERC20Balance();
                
                const userPreDepositBalance = await erc20.balanceOf(user.address);
        
                await liquidityPool.deposit(deposit);
        
                const userPostDepositBalance = await erc20.balanceOf(user.address);
                expect(userPostDepositBalance).to.equal(userPreDepositBalance - deposit);
        
                const liquidityPoolFinalBalance = await liquidityPool.getPoolERC20Balance();
                expect(liquidityPoolFinalBalance).to.equal(bigNumberify(liquidityPoolInitialBalance).add(deposit));
            })

            it('should mint appropriate number of LP tokens on liquidity addition', async () => {
                const initialUserTokenNum = await liquidityPool.getUserLPBalance(
                    user.address
                );
        
                await liquidityPool.deposit(deposit);
                const finalUserTokenNum = await liquidityPool.getUserLPBalance(
                    user.address
                );

                const poolERC20Balance = await liquidityPool.getPoolERC20Balance();
                const poolTotalSupply = await liquidityPool.totalSupply();
        
                const expectedTokenNum = calculateLPTokenDelta(
                    deposit,
                    poolERC20Balance,
                    poolTotalSupply
                );
                expect(finalUserTokenNum).to.equal(bigNumberify(initialUserTokenNum).add(expectedTokenNum));
            })
        })
    })

    describe('withdraw', () => {
        const withdraw = 3;

        beforeEach(async () => {
            const deposit = 10;
            await liquidityPool.deposit(deposit);
        })

        it('should reject zero withdrawal', async () => {
            await expect(liquidityPool.withdraw("0")).to.be.revertedWith('Pool/can not withdraw 0')
        })

        it('should withdraw liquidity from the pool', async () => {
            const userPreWithdrawBalance = await erc20.balanceOf(user.address);    
            const liquidityPoolBalancePreWithdraw = await liquidityPool.getPoolERC20Balance();

            await liquidityPool.withdraw(withdraw);
    
            const userPostWithdrawBalance = await erc20.balanceOf(user.address);
            expect(userPostWithdrawBalance).to.equal(bigNumberify(userPreWithdrawBalance).add(withdraw));
    
            const liquidityPoolBalancePostWithdraw = await liquidityPool.getPoolERC20Balance()
            expect(liquidityPoolBalancePostWithdraw).to.equal(
                liquidityPoolBalancePreWithdraw - withdraw
            );
        })

        it('should burn appropriate number of LP tokens on liquidity withdraw', async () => {
            const userLPTokenNumPreWithdraw = await liquidityPool.getUserLPBalance(
                user.address
            );

            await liquidityPool.withdraw(withdraw);
            
            const userLPTokenNumPostWithdraw = await liquidityPool.getUserLPBalance(
                user.address
            );
            
            const poolERC20Balance = await liquidityPool.getPoolERC20Balance();
            const poolTotalSupply = await liquidityPool.totalSupply();

            const expectedTokenDelta = calculateLPTokenDelta(
                withdraw,
                poolERC20Balance,
                poolTotalSupply
            );

            expect(userLPTokenNumPostWithdraw).to.equal(userLPTokenNumPreWithdraw - expectedTokenDelta);
        });
    });
})

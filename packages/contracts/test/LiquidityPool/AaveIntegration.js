const { use, expect } = require('chai');
const { ethers } = require('@nomiclabs/buidler');
const { solidity } = require('ethereum-waffle');
const moneyLegoERC20 = require('@studydefi/money-legos/erc20');

const LiquidityPool = require('../../build/LiquidityPool.json');
const { deployTestContract } = require('../helpers/deployTestContract');
const { startChain } = require('../helpers/startChain');

use(solidity);

describe('Aave integration - liquidity pool', async () => {
    let liquidityPool;
    // let aDai;
    let dai;
    let user;
    const deposit = 10;
    const aaveTransfer = 5;

    // const aDAIRopsten = '0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201';
    const daiRopsten = '0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108';

    beforeEach(async () => {
        // TODO: test needs a user account loaded with Ropsten DAI - pass private key to startChain()
        user = await startChain();
        dai = await new ethers.Contract(daiRopsten, moneyLegoERC20.dai.abi, user);

        liquidityPool = await deployTestContract(user, LiquidityPool, [
            daiRopsten,
        ]);

        await dai.approve(liquidityPool.address, deposit)

        // aDai = await new ethers.Contract(aDAIRopsten, aave.ATokenAbi, user);

        await liquidityPool.deposit(deposit);
    });

    describe("exchange Tokens for aTokens", () => {
        it('should transfer funds to Aave and receive aTokens', async () => {
            const aDaiBalancePreTransfer = await liquidityPool.getPoolATokenBalance();
            expect(aDaiBalancePreTransfer).to.equal(0);
    
            await liquidityPool.transferToAave(aaveTransfer);
    
            const aDaiBalancePostTransfer = await liquidityPool.getPoolATokenBalance();
            const daiBalancePostTransfer = await liquidityPool.getPoolERC20Balance();

            expect(daiBalancePostTransfer).to.equal(deposit - aaveTransfer);
            expect(aDaiBalancePostTransfer).to.equal(aaveTransfer);
        });
    })

    describe("redeem aTokens for Tokens", () => {
        beforeEach(async () => {
            await liquidityPool.transferToAave(aaveTransfer);
        })

        it('should redeem aTokens for underlying collateral', async () => {
            await liquidityPool.withdrawFromAave(aaveTransfer);
    
            const aDaiBalancePostWithdraw = await liquidityPool.getPoolATokenBalance();
    
            const daiBalancePostWithdraw = await liquidityPool.getPoolERC20Balance();
            expect(aDaiBalancePostWithdraw).to.equal(0);
            expect(daiBalancePostWithdraw).to.equal(deposit);
        });
    })
});

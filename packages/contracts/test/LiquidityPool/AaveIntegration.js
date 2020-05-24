const { use, expect } = require('chai');
const { ethers } = require('@nomiclabs/buidler');
const { solidity, deployContract } = require('ethereum-waffle');
const moneyLegoERC20 = require('@studydefi/money-legos/erc20');

const LiquidityPool = require('../../artifacts/LiquidityPool.json');
const { startChain } = require('../helpers/startChain');

use(solidity);

describe.skip('Aave integration - liquidity pool', async () => {
    let liquidityPool;
    let dai;
    let user;
    const deposit = 10;
    const aaveTransfer = 5;

    const daiRopsten = '0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108';

    before(async () => {
        // TODO: test needs a user account loaded with Ropsten DAI - pass private key to startChain()
        user = await startChain();
    });

    beforeEach(async () => {
        dai = await new ethers.Contract(
            daiRopsten,
            moneyLegoERC20.dai.abi,
            user
        );

        liquidityPool = await deployContract(user, LiquidityPool, [daiRopsten]);

        await liquidityPool.initialiseAave();

        await dai.approve(liquidityPool.address, deposit);
        await liquidityPool.deposit(deposit);
    });

    it('should transfer funds to Aave and receive aTokens', async () => {
        const aDaiBalancePreTransfer = await liquidityPool.getPoolATokenBalance();
        expect(aDaiBalancePreTransfer).to.equal(0);

        await liquidityPool.transferToAave(aaveTransfer);

        const aDaiBalancePostTransfer = await liquidityPool.getPoolATokenBalance();
        const daiBalancePostTransfer = await liquidityPool.getPoolERC20Balance();

        expect(daiBalancePostTransfer).to.equal(deposit - aaveTransfer);
        expect(aDaiBalancePostTransfer).to.equal(aaveTransfer);
    });

    it('should redeem aTokens for underlying collateral', async () => {
        await liquidityPool.transferToAave(aaveTransfer);
        await liquidityPool.withdrawFromAave(aaveTransfer);

        const aDaiBalancePostWithdraw = await liquidityPool.getPoolATokenBalance();

        const daiBalancePostWithdraw = await liquidityPool.getPoolERC20Balance();
        expect(aDaiBalancePostWithdraw).to.equal(0);
        expect(daiBalancePostWithdraw).to.equal(deposit);
    });
});

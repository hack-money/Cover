const { use, expect } = require('chai');
const { ethers } = require('ethers');
const { solidity } = require('ethereum-waffle');
const aave = require('@studydefi/money-legos/aave');
const moneyLegoERC20 = require('@studydefi/money-legos/erc20');

const LiquidityPool = require('../../build/LiquidityPool.json');
const { deployTestContract } = require('../helpers/deployTestContract');
const { startChain } = require('../helpers/startChain');

use(solidity);

describe.skip('Aave integration - liquidity pool', async () => {
    let liquidityPool;
    let aDai;
    let dai;
    let user;
    const deposit = 10;
    const aaveTransfer = 5;

    const aDAIRopsten = '0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201';
    const daiRopsten = '0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108';

    beforeEach(async () => {
        // TODO: test needs a user account loaded with Ropsten DAI - pass private key to startChain()
        user = await startChain();
        dai = await new ethers.Contract(daiRopsten, moneyLegoERC20.dai.abi, user);

        liquidityPool = await deployTestContract(user, LiquidityPool, [
            daiRopsten,
        ]);

        await dai.transfer(liquidityPool.address, 1);
        await dai.approve(liquidityPool.address, deposit)

        aDai = await new ethers.Contract(aDAIRopsten, aave.ATokenAbi, user);
    });

    it('should transfer funds to Aave and receive aTokens', async () => {
        await liquidityPool.deposit(1);
        const aDaiBalancePreTransfer = await aDai.balanceOf(
            liquidityPool.address
        );
        expect(aDaiBalancePreTransfer).to.equal(0);

        const receipt = await liquidityPool.transferToAave(aaveTransfer);
        expect(receipt).to.not.equal(undefined);

        const aDaiBalancePostTransfer = await aDai.balanceOf(
            liquidityPool.address
        );
        expect(aDaiBalancePostTransfer).to.equal(deposit);
    });

    it('should redeem aTokens for underlying collateral', async () => {
        await liquidityPool.deposit(deposit);
        await liquidityPool.transferToAave(aaveTransfer);

        const receipt = await liquidityPool.withdrawFromAave(aaveTransfer);
        expect(receipt).to.not.equal(undefined);

        const aDaiBalancePostWithdraw = await aDai.balanceOf(
            liquidityPool.address
        );

        const daiBalancePostWithdraw = await dai.balanceOf(
            liquidityPool.address
        );
        expect(aDaiBalancePostWithdraw).to.equal(0);
        expect(daiBalancePostWithdraw).to.equal(aaveTransfer);
    });
});

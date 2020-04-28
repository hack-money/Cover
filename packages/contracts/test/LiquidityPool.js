const { waffle } = require('@nomiclabs/buidler');
const {use, expect} = require('chai');
const {solidity, MockProvider, getWallets, deployContract} = require('ethereum-waffle');
const ERC20Mintable = require('../build/ERC20Mintable.json');
const LiquidityPool = require('../build/LiquidityPool.json');

use(solidity);

const provider = new MockProvider();
const [wallet] = provider.getWallets();

function deployNamedContract(contract, initialValue) {
  return deployContract(
      wallet, // a wallet to sign transactions
      contract, // the compiled output
      initialValue
  ); // an ethers 'Contract' class instance
}

function deployToken(initialValue) {
  return deployNamedContract(ERC20Mintable, initialValue)
}

function deployLiquidityPool(initialValue) {
    return deployNamedContract(LiquidityPool, initialValue)
}

describe('LiquidityPool', async () => {
    let erc20;
    let liquidityPool;

    beforeEach(async () => {
        erc20 = await deployToken(["TESTTOKEN", "TEST"]);
        liquidityPool = await deployLiquidityPool([erc20.address]);
    });

    it('should set owner of liquidity pool', async () => {
        const owner = await liquidityPool.owner();
        expect(owner).to.equal(wallet.address);
    });

    it("accurately report it's balance", async () => {
        const trueBalance = "200"
        await erc20.mint(liquidityPool.address, trueBalance);
        const reportedBalance = await liquidityPool.totalBalance()
        expect(reportedBalance).to.equal(trueBalance);
    });
});
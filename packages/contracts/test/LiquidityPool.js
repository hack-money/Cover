const { waffle } = require('@nomiclabs/buidler');
const {use, expect} = require('chai');
const {solidity, MockProvider, getWallets, deployContract} = require('ethereum-waffle');
const LiquidityPool = require('../build/LiquidityPool.json');

use(solidity);

const provider = new MockProvider();
const [wallet] = provider.getWallets();

async function deployLiquidityPool(initialValue) {
    const liquidityPool = await deployContract(
      wallet, // a wallet to sign transactions
      LiquidityPool, // the compiled output
      initialValue
    );
    return liquidityPool; // an ethers 'Contract' class instance
  }

describe('LiquidityPool', async () => {
    let liquidityPool;

    beforeEach(async () => {
        liquidityPool = await deployLiquidityPool();
    });

    it('should set owner of liquidity pool', async () => {
        const owner = await liquidityPool.owner();
        expect(owner).to.equal(wallet.address);
    });
});
const { waffle } = require('@nomiclabs/buidler');
const { use, expect } = require('chai');
const {
  solidity,
  MockProvider,
  getWallets,
  deployContract,
} = require('ethereum-waffle');
const { randomHex } = require('web3-utils');
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
  const erc20Address = randomHex(20);
  const deposit = 10;
  const withdraw = 3;

  beforeEach(async () => {
    liquidityPool = await deployLiquidityPool(erc20Address);
  });

  it('should set owner of pool', async () => {
    const owner = await liquidityPool.owner();
    expect(owner).to.equal(wallet.address);
  });

  it('should set linked ERC20 token', async () => {
    const linkedToken = await liquidityPool.getLinkedToken();
    expect(linkedToken).to.equal(erc20Address);
  });

  it('should add liquidity to the pool', async () => {
    const { receipt } = await liquidityPool.deposit(deposit);
    expect(receipt.status).to.equal(true);
  });

  it('should mint appropriate number of LP tokens on liquidity addition', async () => {
    const expectedPostMintTokens = deposit;

    await liquidityPool.deposit(deposit);
    const numLPTokens = await liquidityPool.getUserLPTokens();
    expect(numLPTokens).to.equal(expectedPostMintTokens);
  });

  it('should withdraw liquidity from the pool', async () => {
    const { receipt } = await liquidityPool.withdraw(withdraw);
    expect(receipt.status).to.equal(true);
  });

  it('should burn appropriate number of LP tokens on liquidity withdraw', async () => {
    const expectedPostBurnTokens = deposit - withdraw;
    
    await liquidityPool.deposit(deposit);
    await liquidityPool.withdraw(withdraw);
    const numLPTokens = await liquidityPool.getUserLPTokens();
    expect(numLPTokens).to.equal(expectedPostBurnTokens);
  });
});

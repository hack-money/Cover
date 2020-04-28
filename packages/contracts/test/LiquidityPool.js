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
const ERC20Mintable = require('../build/ERC20Mintable.json');

use(solidity);

const provider = new MockProvider();
const [wallet] = provider.getWallets();

async function deployTestContract(contractArtifact, constructorArgument) {
  const deployedContract = await deployContract(
    wallet, // a wallet to sign transactions
    contractArtifact, // the compiled output
    constructorArgument
  );
  return deployedContract; // an ethers 'Contract' class instance
}

describe('LiquidityPool', async () => {
  let liquidityPool;
  let erc20;
  const deposit = 10;
  const withdraw = 3;

  beforeEach(async () => {
    erc20 = await deployTestContract(ERC20Mintable);
    liquidityPool = await deployTestContract(LiquidityPool, [erc20.address]);

    // mint ERC20 tokens to liquidityPool to aid testing flow - pool needs to start with tokens
    await erc20.mint(liquidityPool.address, 100);

    const userTokens = 20;
    await erc20.mint(wallet.address, userTokens);
    await erc20.approve(liquidityPool.address, userTokens);
  });

  it('should set owner of pool', async () => {
    const owner = await liquidityPool.owner();
    expect(owner).to.equal(wallet.address);
  });

  it('should set linked ERC20 token', async () => {
    const linkedToken = await liquidityPool.getLinkedToken();
    expect(linkedToken).to.equal(erc20.address);
  });

  it('should add liquidity to the pool', async () => {
    const receipt = await liquidityPool.deposit(deposit);
    expect(receipt).to.not.equal(undefined);
  });

  it('should mint appropriate number of LP tokens on liquidity addition', async () => {
    const expectedPostMintTokens = deposit;

    await liquidityPool.deposit(deposit);
    const numLPTokens = await liquidityPool.getUserLPTokens();
    expect(numLPTokens).to.equal(expectedPostMintTokens);
  });

  it('should withdraw liquidity from the pool', async () => {
    const receipt = await liquidityPool.withdraw(withdraw);
    expect(receipt).to.not.equal(undefined);
  });

  it('should burn appropriate number of LP tokens on liquidity withdraw', async () => {
    const expectedPostBurnTokens = deposit - withdraw;
    
    await liquidityPool.deposit(deposit);
    await liquidityPool.withdraw(withdraw);
    const numLPTokens = await liquidityPool.getUserLPTokens();
    expect(numLPTokens).to.equal(expectedPostBurnTokens);
  });
});

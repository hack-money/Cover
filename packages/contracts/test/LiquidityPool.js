const { waffle } = require('@nomiclabs/buidler');
const { use, expect } = require('chai');
const {
  solidity,
  MockProvider,
  getWallets,
  deployContract,
} = require('ethereum-waffle');
const LiquidityPool = require('../build/LiquidityPool.json');
const ERC20Mintable = require('../build/ERC20Mintable.json');

use(solidity);

const provider = new MockProvider();
const [wallet] = provider.getWallets();

async function deployTestContract(contractArtifact, constructorArgument) {
  const deployedContract = await deployContract(
    wallet,
    contractArtifact,
    constructorArgument
  );
  return deployedContract;
}

describe('LiquidityPool', async () => {
  let liquidityPool;
  let erc20;
  const deposit = 10;
  const withdraw = 3;
  const numUserTokens = 20;
  const initialLiquidityPoolMint = 100;

  beforeEach(async () => {
    erc20 = await deployTestContract(ERC20Mintable);
    liquidityPool = await deployTestContract(LiquidityPool, [erc20.address]);

    // mint ERC20 tokens to liquidityPool to aid testing flow - pool needs to start with tokens
    await erc20.mint(liquidityPool.address, initialLiquidityPoolMint);

    await erc20.mint(wallet.address, numUserTokens);
    await erc20.approve(liquidityPool.address, numUserTokens);
  });

  it('should set owner of pool', async () => {
    const owner = await liquidityPool.owner();
    expect(owner).to.equal(wallet.address);
  });

  it('should set linked ERC20 token', async () => {
    const linkedToken = await liquidityPool.linkedToken();
    expect(linkedToken).to.equal(erc20.address);
  });

  it('should add liquidity to the pool', async () => {
    const userPreDepositBalance = await erc20.balanceOf(wallet.address);
    expect(userPreDepositBalance).to.equal(numUserTokens)

    const receipt = await liquidityPool.deposit(deposit);
    expect(receipt).to.not.equal(undefined);

    const userPostDepositBalance = await erc20.balanceOf(wallet.address);
    expect(userPostDepositBalance).to.equal(numUserTokens - deposit);

    const liquidityPoolBalance = await erc20.balanceOf(liquidityPool.address);
    expect(liquidityPoolBalance).to.equal(initialLiquidityPoolMint + deposit)
  });

  // TODO
  it('should mint appropriate number of LP tokens on liquidity addition', async () => {
  });

  it('should withdraw liquidity from the pool', async () => {
    await liquidityPool.deposit(deposit);

    const userPostDepositBalance = await erc20.balanceOf(wallet.address);
    expect(userPostDepositBalance).to.equal(numUserTokens - deposit);

    const liquidityPoolBalancePreWithdraw = await erc20.balanceOf(liquidityPool.address);
    expect(liquidityPoolBalancePreWithdraw).to.equal(initialLiquidityPoolMint + deposit);

    const receipt = await liquidityPool.withdraw(withdraw);
    expect(receipt).to.not.equal(undefined);

    const userPostWithdrawBalance = await erc20.balanceOf(wallet.address);
    expect(userPostWithdrawBalance).to.equal(numUserTokens - deposit + withdraw);

    const liquidityPoolBalancePostWithdraw = await erc20.balanceOf(liquidityPool.address);
    expect(liquidityPoolBalancePostWithdraw).to.equal(initialLiquidityPoolMint + deposit - withdraw);
    
  });

  // TODO
  it('should burn appropriate number of LP tokens on liquidity withdraw', async () => {
  });
});

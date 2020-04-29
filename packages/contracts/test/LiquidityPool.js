const { waffle } = require('@nomiclabs/buidler');
const { use, expect } = require('chai');
const {
  solidity,
  MockProvider,
  deployContract,
} = require('ethereum-waffle');

const LiquidityPool = require('../build/LiquidityPool.json');
const ERC20Mintable = require('../build/ERC20Mintable.json');
const { calculateLPTokenDelta } = require('./helpers/calculateLPTokenDelta');

use(solidity);

const provider = new MockProvider();
const [user1, user2] = provider.getWallets();

async function deployTestContract(contractArtifact, constructorArgument) {
  const deployedContract = await deployContract(
    user1,
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
  const initialLiquidityPoolMint = 1;
  const initialLPTokens = 1;

  beforeEach(async () => {
    erc20 = await deployTestContract(ERC20Mintable);
    liquidityPool = await deployTestContract(LiquidityPool, [erc20.address]);

    // mint ERC20 tokens to liquidityPool to aid testing flow - pool needs to start with tokens
    await erc20.mint(liquidityPool.address, initialLiquidityPoolMint);

    await erc20.mint(user1.address, numUserTokens);
    await erc20.approve(liquidityPool.address, numUserTokens);
  });

  it('should set owner of pool', async () => {
    const owner = await liquidityPool.owner();
    expect(owner).to.equal(user1.address);
  });

  it('should set linked ERC20 token', async () => {
    const linkedToken = await liquidityPool.linkedToken();
    expect(linkedToken).to.equal(erc20.address);
  });

  it('should add liquidity to the pool', async () => {
    const userPreDepositBalance = await erc20.balanceOf(user1.address);
    expect(userPreDepositBalance).to.equal(numUserTokens)

    const receipt = await liquidityPool.deposit(deposit);
    expect(receipt).to.not.equal(undefined);

    const userPostDepositBalance = await erc20.balanceOf(user1.address);
    expect(userPostDepositBalance).to.equal(numUserTokens - deposit);

    const liquidityPoolBalance = await erc20.balanceOf(liquidityPool.address);
    expect(liquidityPoolBalance).to.equal(initialLiquidityPoolMint + deposit)
  });

  it('should mint appropriate number of LP tokens on liquidity addition', async () => {
    const initialUserTokenNum = await liquidityPool.getUserLPBalance(user1.address)
    expect(initialUserTokenNum).to.equal(initialLPTokens);

    await liquidityPool.deposit(deposit);
    const finalUserTokenNum = await liquidityPool.getUserLPBalance(user1.address);

    const poolERC20Balance = await liquidityPool.getPoolERC20Balance();
    const poolTotalSupply = await liquidityPool.totalSupply();

    const expectedTokenNum = calculateLPTokenDelta(deposit, poolERC20Balance, poolTotalSupply)
    expect(finalUserTokenNum).to.equal(expectedTokenNum + initialLPTokens)
  });

  it('should withdraw liquidity from the pool', async () => {
    await liquidityPool.deposit(deposit);

    const userPostDepositBalance = await erc20.balanceOf(user1.address);
    expect(userPostDepositBalance).to.equal(numUserTokens - deposit);

    const liquidityPoolBalancePreWithdraw = await erc20.balanceOf(liquidityPool.address);
    expect(liquidityPoolBalancePreWithdraw).to.equal(initialLiquidityPoolMint + deposit);

    const receipt = await liquidityPool.withdraw(withdraw);
    expect(receipt).to.not.equal(undefined);

    const userPostWithdrawBalance = await erc20.balanceOf(user1.address);
    expect(userPostWithdrawBalance).to.equal(numUserTokens - deposit + withdraw);

    const liquidityPoolBalancePostWithdraw = await erc20.balanceOf(liquidityPool.address);
    expect(liquidityPoolBalancePostWithdraw).to.equal(initialLiquidityPoolMint + deposit - withdraw);
    
  });

  // TODO
  it('should burn appropriate number of LP tokens on liquidity withdraw', async () => {
  });
});

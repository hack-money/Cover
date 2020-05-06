
const { use, expect } = require('chai');
const { solidity, MockProvider, createFixtureLoader } = require('ethereum-waffle');

const { Zero, MaxUint256 } = require('ethers/constants');
const { bigNumberify } = require('ethers/utils');
const { v2Fixture } = require('../shared/fixtures')

const { expandTo18Decimals, mineBlock } = require('../shared/utilities')

use(solidity)

const overrides = {
  gasLimit: 9999999
}

describe('UniswapV2Router01', () => {
  const provider = new MockProvider(overrides)
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let token0
  let token1
  let WETH
  let factory
  let router
  let pair
  beforeEach(async () => {
    const fixture = await loadFixture(v2Fixture)
    token0 = fixture.token0
    token1 = fixture.token1
    WETH = fixture.WETH
    factory = fixture.factory
    router = fixture.router
    pair = fixture.pair
  })

  afterEach(async function() {
    expect(await provider.getBalance(router.address)).to.eq(Zero)
  })

  it('factory, WETH', async () => {
    expect(await router.factory()).to.eq(factory.address)
    expect(await router.WETH()).to.eq(WETH.address)
  })

  async function addLiquidity(token0Amount, token1Amount) {
    await token0.transfer(pair.address, token0Amount)
    await token1.transfer(pair.address, token1Amount)
    await pair.mint(wallet.address)
  }

  it('swapExactTokensForTokens', async () => {
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
    await addLiquidity(token0Amount, token1Amount)

    const swapAmount = expandTo18Decimals(1)
    const expectedOutputAmount = bigNumberify('1662497915624478906')
    await token0.approve(router.address, MaxUint256)
    await expect(
      router.swapExactTokensForTokens(
        swapAmount,
        0,
        [token0.address, token1.address],
        wallet.address,
        MaxUint256,
        overrides
      )
    ).to.emit(token0, 'Transfer')
      .withArgs(wallet.address, pair.address, swapAmount)
      .to.emit(token1, 'Transfer')
      .withArgs(pair.address, wallet.address, expectedOutputAmount)
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
      .to.emit(pair, 'Swap')
      .withArgs(router.address, swapAmount, 0, 0, expectedOutputAmount, wallet.address)
  })

  it('swapExactTokensForTokens:gas', async () => {
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
    await addLiquidity(token0Amount, token1Amount)

    // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
    await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    await pair.sync(overrides)

    const swapAmount = expandTo18Decimals(1)
    await token0.approve(router.address, MaxUint256)
    await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    const tx = await router.swapExactTokensForTokens(
      swapAmount,
      0,
      [token0.address, token1.address],
      wallet.address,
      MaxUint256,
      overrides
    )
    const receipt = await tx.wait()
    expect(receipt.gasUsed).to.eq(110301)
  })

  it('swapTokensForExactTokens', async () => {
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
    await addLiquidity(token0Amount, token1Amount)

    const expectedSwapAmount = bigNumberify('557227237267357629')
    const outputAmount = expandTo18Decimals(1)
    await token0.approve(router.address, MaxUint256)
    await expect(
      router.swapTokensForExactTokens(
        outputAmount,
        MaxUint256,
        [token0.address, token1.address],
        wallet.address,
        MaxUint256,
        overrides
      )
    )
      .to.emit(token0, 'Transfer')
      .withArgs(wallet.address, pair.address, expectedSwapAmount)
      .to.emit(token1, 'Transfer')
      .withArgs(pair.address, wallet.address, outputAmount)
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount.add(expectedSwapAmount), token1Amount.sub(outputAmount))
      .to.emit(pair, 'Swap')
      .withArgs(router.address, expectedSwapAmount, 0, 0, outputAmount, wallet.address)
  })
})
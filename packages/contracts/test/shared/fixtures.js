import { Contract } from 'ethers'
import { deployContract } from 'ethereum-waffle'
import { bigNumberify } from 'ethers/utils'


const ERC20Mintable = require('../../build/ERC20Mintable.json');
const UniswapV2Factory = require('../../build/UniswapV2Factory.json');
const UniswapV2Pair = require('../../build/UniswapV2Pair.json');

const overrides = {
  gasLimit: 9999999
}

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}


export async function factoryFixture(wallet) {
  const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address], overrides)
  return { factory }
}

export async function pairFixture(provider, wallet) {
  const { factory } = await factoryFixture(provider, [wallet])

  const tokenA = await deployContract(wallet, ERC20Mintable, overrides)
  const tokenB = await deployContract(wallet, ERC20Mintable, overrides)
  await tokenA.mint(wallet.address, expandTo18Decimals(10000))
  await tokenB.mint(wallet.address, expandTo18Decimals(10000))

  await factory.createPair(tokenA.address, tokenB.address, overrides)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(UniswapV2Pair.abi), provider).connect(wallet)

  const token0Address = (await pair.token0()).address
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  return { factory, token0, token1, pair }
}
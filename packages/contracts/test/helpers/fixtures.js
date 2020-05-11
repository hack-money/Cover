const { Contract } = require('ethers');
const { bigNumberify } = require('ethers/utils');
const { deployContract } = require('ethereum-waffle');

const UniswapV2Pair = require('@uniswap/v2-core/build/UniswapV2Pair.json');
const IUniswapV2Pair = require('@uniswap/v2-core/build/IUniswapV2Pair.json');
const UniswapV2Factory = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router01 = require('@uniswap/v2-periphery/build/UniswapV2Router01.json');
const WETH9 = require('@uniswap/v2-periphery/build/WETH9.json');
const ERC20Mintable = require('../../build/ERC20Mintable.json');

const CallOptions = require('../../build/CallOptions.json');
const LiquidityPool = require('../../build/LiquidityPool.json');

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18));
}

const overrides = {
    gasLimit: 9999999,
};

async function factoryFixture(wallet) {
    const factory = await deployContract(
        wallet,
        UniswapV2Factory,
        [wallet.address],
        overrides
    );
    return { factory };
}

async function pairFixture(provider, [wallet]) {
    const { factory } = await factoryFixture(wallet);

    const tokenA = await deployContract(wallet, ERC20Mintable, [], overrides);
    const tokenB = await deployContract(wallet, ERC20Mintable, [], overrides);
    await tokenA.mint(wallet.address, expandTo18Decimals(10000));
    await tokenB.mint(wallet.address, expandTo18Decimals(10000));

    await factory.createPair(tokenA.address, tokenB.address, overrides);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    const pair = new Contract(
        pairAddress,
        JSON.stringify(UniswapV2Pair.abi),
        provider
    ).connect(wallet);

    const token0Address = (await pair.token0()).address;
    const token0 = tokenA.address === token0Address ? tokenA : tokenB;
    const token1 = tokenA.address === token0Address ? tokenB : tokenA;

    return { factory, token0, token1, pair };
}

async function v2Fixture(provider, [wallet]) {
    // deploy core and initialise
    const { factory, token0, token1, pair } = await pairFixture(provider, [
        wallet,
    ]);

    // deploy WETH
    const WETH = await deployContract(wallet, WETH9);
    const WETHPartner = await deployContract(
        wallet,
        ERC20Mintable,
        [],
        overrides
    );
    await WETHPartner.mint(wallet.address, expandTo18Decimals(10000));

    // deploy WETH pair
    await factory.createPair(WETH.address, WETHPartner.address);
    const WETHPairAddress = await factory.getPair(
        WETH.address,
        WETHPartner.address
    );
    const WETHPair = new Contract(
        WETHPairAddress,
        JSON.stringify(IUniswapV2Pair.abi),
        provider
    ).connect(wallet);

    // deploy router and migrator
    const router = await deployContract(
        wallet,
        UniswapV2Router01,
        [factory.address, WETH.address],
        overrides
    );

    return {
        token0,
        token1,
        WETH,
        WETHPartner,
        factory,
        router,
        pair,
        WETHPair,
    };
}

// Fixture that sets up the option, liquidityPool and Uniswap V2
async function generalTestFixture(provider, [liquidityProvider, optionsBuyer]) {
    const { token0, token1, router, pair } = await v2Fixture(provider, [
        liquidityProvider,
    ]);

    const poolToken = token0;
    const paymentToken = token1;

    let optionsContract = await deployContract(
        liquidityProvider,
        CallOptions,
        [poolToken.address, paymentToken.address],
        overrides
    );
    await optionsContract.setUniswapRouter(router.address);

    // liquidityProvider no longer interacts with options contract
    optionsContract = optionsContract.connect(optionsBuyer);

    const liquidityPoolAddress = await optionsContract.pool();
    const liquidityPool = new Contract(
        liquidityPoolAddress,
        LiquidityPool.abi,
        liquidityProvider
    );

    // Add liquidity to Uniswap
    const token0Amount = expandTo18Decimals(50);
    const token1Amount = expandTo18Decimals(100);

    await poolToken.transfer(pair.address, token0Amount);
    await paymentToken.transfer(pair.address, token1Amount);
    await pair.mint(liquidityProvider.address);

    return {
        liquidityPool,
        optionsContract,
        poolToken,
        paymentToken,
    };
}

module.exports = {
    expandTo18Decimals,
    pairFixture,
    v2Fixture,
    generalTestFixture,
};

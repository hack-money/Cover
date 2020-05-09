const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');
const { Contract } = require('ethers');
const { bigNumberify } = require('ethers/utils');
const { v2Fixture } = require('../shared/fixtures');

const CallOptions = require('../../build/CallOptions.json');
const LiquidityPool = require('../../build/LiquidityPool.json');
const { deployTestContract } = require('../helpers/deployTestContract');
const { expandTo18Decimals } = require('../shared/utilities');

const { VALID_DURATION } = require('../helpers/constants');

use(solidity);

describe.only('Uniswap integration', async () => {
    let poolToken;
    let paymentToken;
    let router;
    let liquidityPool;
    let optionsContract;
    let pair;
    const numPoolTokens = 2000;
    const numPaymentTokens = 2000;

    const provider = new MockProvider({ gasLimit: 9999999 });
    const [liquidityProvider, optionsBuyer] = provider.getWallets();

    const loadFixture = createFixtureLoader(provider, [liquidityProvider]);

    beforeEach(async () => {
        // setup Uniswap
        const fixture = await loadFixture(v2Fixture);
        poolToken = fixture.token0;
        paymentToken = fixture.token1;
        router = fixture.router;
        pair = fixture.pair;

        optionsContract = await deployTestContract(
            liquidityProvider,
            CallOptions,
            [poolToken.address, paymentToken.address]
        );

        await optionsContract.setUniswapRouter(router.address);

        // liquidityProvider no longer interacts with options contract
        optionsContract = optionsContract.connect(optionsBuyer);

        const liquidityPoolAddress = await optionsContract.pool();
        liquidityPool = new Contract(
            liquidityPoolAddress,
            LiquidityPool.abi,
            liquidityProvider
        );

        // Give liquidityProvider tokens to buy deposit into pool
        await poolToken.mint(liquidityProvider.address, numPoolTokens);
        await poolToken.approve(liquidityPool.address, numPoolTokens);
        await liquidityPool.deposit(numPoolTokens);

        // Give optionsBuyer tokens to buy option with
        await paymentToken.mint(optionsBuyer.address, numPaymentTokens);
        await paymentToken
            .connect(optionsBuyer)
            .approve(optionsContract.address, numPaymentTokens);
    });

    async function addLiquidity(token0Amount, token1Amount) {
        await poolToken.transfer(pair.address, token0Amount);
        await paymentToken.transfer(pair.address, token1Amount);
        await pair.mint(liquidityProvider.address);
    }

    it.only('should exchange tokens when option is created', async () => {
        const token0Amount = expandTo18Decimals(50);
        const token1Amount = expandTo18Decimals(100);

        await addLiquidity(token0Amount, token1Amount);

        const optionValue = 100;
        const premium = 10; // amount being swapped
        const duration = VALID_DURATION.asSeconds();
        const optionId = bigNumberify(0);

        const initialPoolBalance = await liquidityPool.getPoolERC20Balance();

        await expect(optionsContract.create(duration, optionValue))
            .to.emit(optionsContract, 'Exchange')
            .withArgs(
                optionId,
                paymentToken.address,
                premium,
                poolToken.address,
                4
            );
        
        const finalPoolBalance = await liquidityPool.getPoolERC20Balance();
        expect(finalPoolBalance).to.equal(initialPoolBalance.add(bigNumberify(4)));
    });

    it('should exchange tokens when an option is exercised', async () => {});
});

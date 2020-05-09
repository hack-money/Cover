const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');
const { Contract } = require('ethers');
const { bigNumberify, Interface } = require('ethers/utils');
const { v2Fixture } = require('../shared/fixtures')

const CallOptions = require('../../build/CallOptions.json');
const LiquidityPool = require('../../build/LiquidityPool.json');
const ERC20Mintable = require('../../build/ERC20Mintable.json');
const { deployTestContract } = require('../helpers/deployTestContract');

const {
    contextForSpecificTime,
    contextForOptionHasActivated,
    contextForOptionHasExpired,
} = require('../helpers/contexts');

use(solidity);

describe.only('CallOptions functionality', async () => {
    let poolToken;
    let paymentToken;
    let liquidityPool;
    let optionsContract;
    const numPoolTokens = 2000;
    const numPaymentTokens = 2000;

    const provider = new MockProvider({ gasLimit: 9999999 });
    const [liquidityProvider, optionsBuyer, wallet] = provider.getWallets();
    const OptionsInterface = new Interface(CallOptions.abi);

    const loadFixture = createFixtureLoader(provider, [wallet]);

    let token0;
    let token1;
    let WETH;
    let factory;
    let router;
    let pair;
    beforeEach(async () => {
        const fixture = await loadFixture(v2Fixture);

        token0 = fixture.token0;
        token1 = fixture.token1;
        WETH = fixture.WETH;
        factory = fixture.factory;
        router = fixture.router;
        pair = fixture.pair;

        poolToken = await deployTestContract(liquidityProvider, ERC20Mintable);
        paymentToken = await deployTestContract(
            liquidityProvider,
            ERC20Mintable
        );
        optionsContract = await deployTestContract(
            liquidityProvider,
            CallOptions,
            [poolToken.address, paymentToken.address]
        );

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

    it('should pass', async () => {
        console.log('hello');
    });
});

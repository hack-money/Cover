const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');
const { bigNumberify } = require('ethers/utils');
const { generalFixture } = require('../shared/fixtures');

const { VALID_DURATION } = require('../helpers/constants');

use(solidity);

describe.only('Uniswap integration', async () => {
    let poolToken;
    let paymentToken;
    let liquidityPool;
    let optionsContract;
    const numPoolTokens = 2000;
    const numPaymentTokens = 2000;

    const provider = new MockProvider({ gasLimit: 9999999 });
    const [liquidityProvider, optionsBuyer] = provider.getWallets();

    const loadFixture = createFixtureLoader(provider, [
        liquidityProvider,
        optionsBuyer,
    ]);

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({
            liquidityPool,
            optionsContract,
            poolToken,
            paymentToken,
        } = await loadFixture(generalFixture));

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

    it.only('should exchange tokens when option is created', async () => {
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
        expect(finalPoolBalance).to.equal(
            initialPoolBalance.add(bigNumberify(4))
        );
    });

    it('should exchange tokens when an option is exercised', async () => {});
});

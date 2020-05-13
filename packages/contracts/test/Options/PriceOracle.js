const { use, expect } = require('chai');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');

const { generalTestFixture } = require('../helpers/fixtures');
const { contextForOracleActivated } = require('../helpers/contexts');

use(solidity);

const provider = new MockProvider({ gasLimit: 9999999 });
const [liquidityProvider, optionsBuyer] = provider.getWallets();

const loadFixture = createFixtureLoader(provider, [
    liquidityProvider,
    optionsBuyer,
]);

describe.only('Price oracle', async () => {
    let oracle;
    let paymentToken;
    let poolToken;

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({ poolToken, paymentToken, oracle } = await loadFixture(
            generalTestFixture
        ));
    });

    contextForOracleActivated(provider, () => {
        it('should give a price for a token', async () => {
            await oracle.update();

            const paymentTokenAmount = 4;
            const paymentTokenPrice = await oracle.consult(
                paymentToken.address,
                paymentTokenAmount
            );
            expect(paymentTokenPrice).to.be.above(0); // not a strict test, PoC

            const poolTokenAmount = 4;
            const poolTokenPrice = await oracle.consult(
                poolToken.address,
                poolTokenAmount
            );
            expect(poolTokenPrice).to.be.above(0); // not a strict test, PoC
        });
    });
});

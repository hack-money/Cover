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

describe('Price oracle', async () => {
    let oracle;
    let paymentToken;
    let poolToken;
    let optionsContract;

    beforeEach(async () => {
        // Deploy and link together Options contract, liquidity pool and Uniswap. Extract relevant ERC20s
        ({
            poolToken,
            paymentToken,
            optionsContract,
            oracle,
        } = await loadFixture(generalTestFixture));
    });

    describe('Oracle as a standalone contract', async () => {
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

    describe('Oracle called through options contract', async () => {
        contextForOracleActivated(provider, () => {
            it('should return correct price when calling Options.getPoolTokenPrice()', async () => {
                // TODO: make fn view to return price
                const amount = 100;
                const price = await optionsContract.getPoolTokenPrice(amount);
                const oraclePrice = await oracle.consult(
                    poolToken.address,
                    amount
                );
                expect(price).to.equal(oraclePrice);
            });
        });
    });
});

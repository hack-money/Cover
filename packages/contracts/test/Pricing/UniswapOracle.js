const { waffle } = require('@nomiclabs/buidler');
const { use, expect } = require('chai');
const { solidity, createFixtureLoader } = require('ethereum-waffle');

const { generalTestFixture } = require('../helpers/fixtures');
const { contextForOracleActivated } = require('../helpers/contexts');

use(solidity);

const { provider } = waffle;
const [liquidityProvider, optionsBuyer] = provider.getWallets();

const loadFixture = createFixtureLoader(provider, [
    liquidityProvider,
    optionsBuyer,
]);

describe('Uniswap Price oracle', async () => {
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
        it('should return correct price when calling Options.getPoolTokenPrice()', async () => {
            await oracle.update();

            const amount = 1000;
            const price = await optionsContract.getPoolTokenPrice(amount);
            const amountPoolTokenOut = await oracle.consult(
                poolToken.address,
                amount
            );
            expect(price).to.equal(amountPoolTokenOut);
        });
    });
});

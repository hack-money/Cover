const { use, expect } = require('chai');
const { Interface } = require('ethers/utils');
const {
    solidity,
    MockProvider,
    createFixtureLoader,
} = require('ethereum-waffle');

const Options = require('../../build/Options.json');
const { generalTestFixture } = require('../helpers/fixtures');
const { contextForOracleActivated } = require('../helpers/contexts');

use(solidity);

const provider = new MockProvider({ gasLimit: 9999999 });
const [liquidityProvider, optionsBuyer] = provider.getWallets();
const OptionsInterface = new Interface(Options.abi);

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
        contextForOracleActivated(provider, () => {
            it('should return correct price when calling Options.getPoolTokenPrice()', async () => {
                const amount = 100;
                const tx = await optionsContract.getPoolTokenPrice(amount);
                const receipt = await tx.wait();

                const { price } = OptionsInterface.parseLog(
                    receipt.logs[receipt.logs.length - 1]
                ).values;

                const amountPoolTokenOut = await oracle.consult(
                    poolToken.address,
                    amount
                );
                const poolTokenPrice = amountPoolTokenOut / amount;
                expect(price).to.equal(poolTokenPrice);
            });
        });
    });
});

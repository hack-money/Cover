const { expect, use } = require('chai');
const { Contract } = require('ethers');
const { bigNumberify } = require('ethers/utils');
const {
    solidity,
    createFixtureLoader,
    MockProvider,
} = require('ethereum-waffle');
const { optionFactoryFixture } = require('../helpers/fixtures');

const Options = require('../../build/Options.json');

const { getMarketAddress } = require('../helpers/utilities');

use(solidity);


describe('OptionsFactory', () => {
    const provider = new MockProvider({ gasLimit: 9999999 });
    const [wallet, other] = provider.getWallets();

    const loadFixture = createFixtureLoader(provider, [wallet, other]);

    let factory;
    let tokenAddresses;
    let poolFactory;
    beforeEach(async () => {
        const {
            token0,
            token1,
            optionsFactory,
            liquidityPoolFactory,
        } = await loadFixture(optionFactoryFixture);
        tokenAddresses = [token0.address, token1.address];
        factory = optionsFactory;
        poolFactory = liquidityPoolFactory;
    });

    it('allMarketsLength', async () => {
        expect(await factory.allMarketsLength()).to.eq(0);
    });

    async function createMarket(tokens) {
        const bytecode = `0x${Options.evm.bytecode.object}`;
        const create2Address = getMarketAddress(
            factory.address,
            tokens,
            poolFactory.address,
            bytecode
        );
        await expect(factory.createMarket(...tokens))
            .to.emit(factory, 'MarketCreated')
            .withArgs(
                tokenAddresses[0],
                tokenAddresses[1],
                create2Address,
                bigNumberify(1)
            );

        await expect(factory.createMarket(...tokens)).to.be.revertedWith(
            'OptionsFactory: MARKET_EXISTS'
        );

        expect(await factory.getMarket(...tokens)).to.eq(create2Address);
        expect(await factory.allMarkets(0)).to.eq(create2Address);
        expect(await factory.allMarketsLength()).to.eq(1);

        const optionsContract = new Contract(
            create2Address,
            JSON.stringify(Options.abi),
            provider
        );
        expect(await optionsContract.poolToken()).to.eq(tokenAddresses[0]);
        expect(await optionsContract.paymentToken()).to.eq(tokenAddresses[1]);
    }

    it('createMarket', async () => {
        await createMarket(tokenAddresses);
    });

    // it('createMarket:reverse', async () => {
    //     await createMarket(tokenAddresses.slice().reverse());
    // });

    it('createMarket:gas', async () => {
        const tx = await factory.createMarket(...tokenAddresses);
        const receipt = await tx.wait();
        expect(receipt.gasUsed).to.eq(7207057);
    });
});

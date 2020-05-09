const { use, expect } = require('chai');
const { solidity, MockProvider } = require('ethereum-waffle');
const { bigNumberify, Interface } = require('ethers/utils');

const { deployTestContract } = require('../helpers/deployTestContract');
const CallOptions = require('../../build/CallOptions.json');
const ERC20Mintable = require('../../build/ERC20Mintable.json');

const { blackScholesApprox } = require('../helpers/optionPrices');

use(solidity);


describe.only('OptionPrice', async () => {
    const underlyingPrice = 100;
    const strikePrice = 75;
    const timePeriod = 10;
    const volatility = 10;

    let poolToken;
    let paymentToken;
    let optionsContract;

    const provider = new MockProvider({gasLimit: 9999999});
    const [liquidityProvider, optionsBuyer] = provider.getWallets();
    const OptionsInterface = new Interface(CallOptions.abi);

    beforeEach(async () => {
        poolToken = await deployTestContract(liquidityProvider, ERC20Mintable);
        paymentToken = await deployTestContract(liquidityProvider, ERC20Mintable);
        optionsContract = await deployTestContract(liquidityProvider, CallOptions, [poolToken.address, paymentToken.address]);

        // liquidityProvider no longer interacts with options contract
        optionsContract = optionsContract.connect(optionsBuyer)
    });

    it('should calculate an option price', async () => {
        const result = await optionsContract.calculateFees(underlyingPrice, timePeriod, volatility);
        console.log({ result });
        // const expectedPrice = blackScholesApprox(underlyingPrice, timePeriod, volatility);
        // console.log({ expectedPrice });
        // expect(price).to.equal(expectedPrice);
    });
});
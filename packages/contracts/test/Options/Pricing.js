const { use, expect } = require('chai');
const { solidity, MockProvider } = require('ethereum-waffle');
const { bigNumberify } = require('ethers/utils');

const { deployTestContract } = require('../helpers/deployTestContract');
const Pricing = require('../../build/Pricing.json');

use(solidity);

describe.only('Pricing', async () => {
    let pricingLibrary;
    const provider = new MockProvider({gasLimit: 9999999});
    const [wallet] = provider.getWallets();

    beforeEach(async () => {
        pricingLibrary = await deployTestContract(wallet, Pricing);
    });

    it('should calculate square root of a value', async () => {
        const value = 9;
        const sqrtRoot = Math.sqrt(value);

        const result = await pricingLibrary.squareRoot(value);
        expect(result).to.equal(sqrtRoot);
    });

    it('should calculate platform fee', async () => {
        const amount = 500;
        const fee = amount / 100; // 1% fee
        const result = await pricingLibrary.calculatePlatformFee(amount);
        expect(result).to.equal(fee);

    });

    it('should calculate intrinsic value of a PUT option', async () => {

    });

    it('should calculate intrinsic value of a CALL option', async () => {

    });

    it('should time value of an option', async () => {

    });

    it('should calculate premium of an option', async () => {

    });
});
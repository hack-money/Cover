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

    describe('Intrinsic value', async () => {
        it('should calculate intrinsic value of an out of the money PUT option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 250;
            const putOption = true;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative
    
            const result = await pricingLibrary.calculateIntrinsicValue(strikePrice, amount, underlyingPrice, putOption);
            expect(result).to.equal(intrinsicValue);
        });
    
    
        it('should calculate intrinsic value of an in the money PUT option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 180;
            const putOption = true;
            const intrinsicValue = (strikePrice - underlyingPrice) * amount; // 0 was the intrinsic value would be negative
    
            const result = await pricingLibrary.calculateIntrinsicValue(strikePrice, amount, underlyingPrice, putOption);
            expect(result).to.equal(intrinsicValue);
        });
    
        it('should calculate intrinsic value of an out of the money CALL option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 180;
            const putOption = false;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative
    
            const result = await pricingLibrary.calculateIntrinsicValue(strikePrice, amount, underlyingPrice, putOption);
            expect(result).to.equal(intrinsicValue);
        });
    
        it('should calculate intrinsic value of an in the money CALL option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 220;
            const putOption = false;
            const intrinsicValue = (underlyingPrice - strikePrice) * amount; // 0 was the intrinsic value would be negative
    
            const result = await pricingLibrary.calculateIntrinsicValue(strikePrice, amount, underlyingPrice, putOption);
            expect(result).to.equal(intrinsicValue);
        });
    });

    describe('Time value', async () => {
        it('should calculate time value CALL option', async () => {

        });
    
        it('should time value of an option', async () => {
    
        });
    
        it('should calculate premium of an option', async () => {
    
        });
    });
});
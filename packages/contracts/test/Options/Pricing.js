const { use, expect } = require('chai');
const { deployContract, solidity, MockProvider } = require('ethereum-waffle');

const Pricing = require('../../build/Pricing.json');

use(solidity);

function blackScholesApprox(underlyingPrice, duration, volatility) {
    return 0.4 * underlyingPrice * Math.sqrt(duration) * (volatility / 100);
}

describe('Pricing', async () => {
    let pricingLibrary;
    const provider = new MockProvider({ gasLimit: 9999999 });
    const [wallet] = provider.getWallets();

    beforeEach(async () => {
        pricingLibrary = await deployContract(wallet, Pricing);
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

            const result = await pricingLibrary.calculateIntrinsicValue(
                strikePrice,
                amount,
                underlyingPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue);
        });

        it('should calculate intrinsic value of an in the money PUT option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 180;
            const putOption = true;
            const intrinsicValue = (strikePrice - underlyingPrice) * amount; // 0 was the intrinsic value would be negative

            const result = await pricingLibrary.calculateIntrinsicValue(
                strikePrice,
                amount,
                underlyingPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue);
        });

        it('should calculate intrinsic value of an out of the money CALL option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 180;
            const putOption = false;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative

            const result = await pricingLibrary.calculateIntrinsicValue(
                strikePrice,
                amount,
                underlyingPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue);
        });

        it('should calculate intrinsic value of an in the money CALL option', async () => {
            const strikePrice = 200;
            const amount = 3;
            const underlyingPrice = 220;
            const putOption = false;
            const intrinsicValue = (underlyingPrice - strikePrice) * amount; // 0 was the intrinsic value would be negative

            const result = await pricingLibrary.calculateIntrinsicValue(
                strikePrice,
                amount,
                underlyingPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue);
        });
    });

    describe('Time value', async () => {
        it('should calculate time value of an option', async () => {
            const underlyingPrice = 200;
            const duration = 16;
            const volatility = 5;

            const timeValue = blackScholesApprox(
                underlyingPrice,
                duration,
                volatility
            );
            const result = await pricingLibrary.calculateTimeValue(
                underlyingPrice,
                duration,
                volatility
            );
            expect(result).to.equal(timeValue);
        });
    });

    describe('Premium', async () => {
        it('should calculate premium of an option', async () => {
            // Scenario: In the money PUT option
            const putOption = true;
            const strikePrice = 200;
            const amount = 100;
            const underlyingPrice = 180;
            const duration = 16;
            const volatility = 5;

            const intrinsicValue = (strikePrice - underlyingPrice) * amount;
            const timeValue = blackScholesApprox(
                underlyingPrice,
                duration,
                volatility
            );

            const premium = intrinsicValue + timeValue;
            const result = await pricingLibrary.calculatePremium(
                strikePrice,
                amount,
                duration,
                underlyingPrice,
                volatility,
                putOption
            );
            expect(result).to.equal(premium);
        });
    });
});

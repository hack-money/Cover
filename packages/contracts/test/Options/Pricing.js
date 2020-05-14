const { use, expect } = require('chai');
const { deployContract, solidity, MockProvider } = require('ethereum-waffle');

const Pricing = require('../../build/Pricing.json');

use(solidity);

function blackScholesApprox(currentPrice, duration, volatility) {
    return 0.4 * currentPrice * Math.sqrt(duration) * (volatility / 100);
}

describe.only('Pricing', async () => {
    let pricingContract;
    const provider = new MockProvider({ gasLimit: 9999999 });
    const [wallet] = provider.getWallets();
    const priceDecimals = 1e8;

    beforeEach(async () => {
        pricingContract = await deployContract(wallet, Pricing);
    });

    it('should calculate square root of a value', async () => {
        const value = 9;
        const sqrtRoot = Math.sqrt(value);

        const result = await pricingContract.squareRoot(value);
        expect(result).to.equal(sqrtRoot);
    });

    it('should calculate platform fee', async () => {
        const amount = 500;
        const fee = amount / 100; // 1% fee set in contract
        const result = await pricingContract.calculatePlatformFee(amount);
        expect(result).to.equal(fee);
    });

    describe('Intrinsic value', async () => {
        it('should calculate intrinsic value of an out of the money PUT option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 250 * priceDecimals;
            const putOption = true;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue / priceDecimals);
        });

        it('should calculate intrinsic value of an in the money PUT option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 180 * priceDecimals;
            const putOption = true;
            const intrinsicValue = (strikePrice - currentPrice) * amount; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue / priceDecimals);
        });

        it('should calculate intrinsic value of an out of the money CALL option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 180 * priceDecimals;
            const putOption = false;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue / priceDecimals);
        });

        it('should calculate intrinsic value of an in the money CALL option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 220 * priceDecimals;
            const putOption = false;
            const intrinsicValue = (currentPrice - strikePrice) * amount; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice,
                putOption
            );
            expect(result).to.equal(intrinsicValue / priceDecimals);
        });
    });

    describe('Time value', async () => {
        it('should calculate time value of an option', async () => {
            const amount = 500;
            const currentPrice = 200 * priceDecimals;
            const duration = 16;
            const volatility = 5;

            const timeValue = blackScholesApprox(
                currentPrice,
                duration,
                volatility
            );
            const result = await pricingContract.calculateTimeValue(
                amount,
                currentPrice,
                duration,
                volatility
            );
            expect(result).to.equal(timeValue / priceDecimals);
        });
    });

    describe.skip('Premium', async () => {
        it('should calculate premium of an option', async () => {
            // Scenario: Out of the money PUT option
            const putOption = true;
            const strikePrice = 200;
            const amount = 100;
            const currentPrice = 180;
            const duration = 16;
            const volatility = 5;

            const intrinsicValue = (strikePrice - currentPrice) * amount;
            console.log({ intrinsicValue });
            const timeValue = blackScholesApprox(
                currentPrice,
                duration,
                volatility
            );
            console.log({ timeValue });

            const premium = intrinsicValue + timeValue;
            console.log({ premium });
            const result = await pricingContract.calculatePremium(
                strikePrice,
                amount,
                duration,
                currentPrice,
                volatility,
                putOption
            );
            console.log({ result });

            expect(result).to.equal(premium);
        });
    });
});

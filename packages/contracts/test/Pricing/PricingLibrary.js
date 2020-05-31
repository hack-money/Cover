const { waffle } = require('@nomiclabs/buidler');
const { use, expect } = require('chai');
const { deployContract, solidity } = require('ethereum-waffle');

const Pricing = require('../../build/PricingTest.json');
const {
    calculateExtrinsicValue,
    calcPremiumOffChain,
    calcFeeOffChain,
} = require('./helpers');

use(solidity);

const priceDecimals = 1e8;

describe('Pricing utilities', async () => {
    let pricingContract;
    const { provider } = waffle;

    const [wallet] = provider.getWallets();

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
        const platformFeePercentage = 2000; // 2%
        const fee = calcFeeOffChain(amount, platformFeePercentage);
        const result = await pricingContract.calculatePlatformFee(
            amount,
            platformFeePercentage
        );
        expect(result).to.equal(fee);
    });

    describe('Intrinsic value', async () => {
        it('should calculate intrinsic value of an out of the money PUT option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 250 * priceDecimals;
            const optionType = 1;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice * amount,
                optionType
            );
            expect(result).to.equal(intrinsicValue);
        });

        it('should calculate intrinsic value of an in the money PUT option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 180 * priceDecimals;
            const optionType = 1;
            const intrinsicValue = (strikePrice - currentPrice) * amount; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice * amount,
                optionType
            );
            expect(result).to.equal(intrinsicValue);
        });

        it('should calculate intrinsic value of an out of the money CALL option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 180 * priceDecimals;
            const optionType = 0;
            const intrinsicValue = 0; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice * amount,
                optionType
            );
            expect(result).to.equal(intrinsicValue);
        });

        it('should calculate intrinsic value of an in the money CALL option', async () => {
            const strikePrice = 200 * priceDecimals;
            const amount = 3;
            const currentPrice = 220 * priceDecimals;
            const optionType = 0;
            const intrinsicValue = (currentPrice - strikePrice) * amount; // 0 was the intrinsic value would be negative

            const result = await pricingContract.calculateIntrinsicValue(
                strikePrice,
                amount,
                currentPrice * amount,
                optionType
            );
            expect(result).to.equal(intrinsicValue);
        });
    });

    describe('Extrinsic value', async () => {
        it('should calculate extrinsic value of an option', async () => {
            const amount = 500;
            const currentPrice = 200 * priceDecimals;
            const duration = 16;
            const volatility = 5;

            const extrinsicValue = calculateExtrinsicValue(
                amount,
                currentPrice * amount,
                duration,
                volatility,
                priceDecimals
            );
            const result = await pricingContract.calculateExtrinsicValue(
                amount,
                currentPrice * amount,
                duration,
                volatility
            );

            expect(result).to.equal(extrinsicValue * priceDecimals);
        });
    });

    describe('Premium', async () => {
        it('should calculate premium of an option, no intrinsic value', async () => {
            // Scenario: Out of the money PUT option
            const optionType = 1;
            const strikePrice = 180 * priceDecimals;
            const amount = 100;
            const currentPrice = 200 * priceDecimals;
            const duration = 16;
            const volatility = 6;

            const expectedPremium = calcPremiumOffChain(
                amount,
                currentPrice * amount,
                strikePrice,
                duration,
                volatility,
                priceDecimals,
                optionType
            );
            const result = await pricingContract.calculatePremium(
                strikePrice,
                amount,
                duration,
                currentPrice * amount,
                volatility,
                optionType,
                priceDecimals
            );

            expect(parseInt(result, 10)).to.equal(
                parseInt(expectedPremium, 10)
            );
        });

        it('should calculate premium of an option, has intrinsic value', async () => {
            // Scenario: In the money PUT option
            const optionType = 1;
            const strikePrice = 200 * priceDecimals;
            const amount = 100;
            const currentPrice = 180 * priceDecimals;
            const duration = 16;
            const volatility = 6;

            const expectedPremium = calcPremiumOffChain(
                amount,
                currentPrice * amount,
                strikePrice,
                duration,
                volatility,
                priceDecimals,
                optionType
            );

            const result = await pricingContract.calculatePremium(
                strikePrice,
                amount,
                duration,
                currentPrice * amount,
                volatility,
                optionType,
                priceDecimals
            );

            expect(parseInt(result, 10)).to.equal(
                parseInt(expectedPremium, 10)
            );
        });
    });
});

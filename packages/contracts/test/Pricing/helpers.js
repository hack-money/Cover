function calculateExtrinsicValue(
    amount,
    currentPrice,
    duration,
    volatility,
    priceDecimals
) {
    const valuePerAmount =
        0.4 * currentPrice * Math.sqrt(duration) * (volatility / 100);
    return (valuePerAmount * amount) / priceDecimals;
}

// eslint-disable-next-line consistent-return
function calculateIntrinsicValue(
    strikePrice,
    currentPrice,
    priceDecimals,
    amount,
    putOption
) {
    if (putOption === 1) {
        if (strikePrice < currentPrice) {
            return 0;
        }
        return ((strikePrice - currentPrice) / priceDecimals) * amount;
    }

    if (putOption === 0) {
        if (currentPrice < strikePrice) {
            return 0;
        }
        return ((currentPrice - strikePrice) / priceDecimals) * amount;
    }
}

function calcPremiumOffChain(
    amount,
    currentPrice,
    strikePrice,
    duration,
    volatility,
    priceDecimals,
    putOption
) {
    const intrinsicValue = calculateIntrinsicValue(
        strikePrice,
        currentPrice,
        priceDecimals,
        amount,
        putOption
    );
    const extrinsicValue = calculateExtrinsicValue(
        amount,
        currentPrice,
        duration,
        volatility,
        priceDecimals
    );

    return (intrinsicValue + extrinsicValue) / 100;
}
function calcFeeOffChain(amount, platformFeePercentage) {
    return amount * (platformFeePercentage / 10000);
}

module.exports = {
    calcPremiumOffChain,
    calculateExtrinsicValue,
    calcFeeOffChain,
};

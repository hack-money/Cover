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
    if (putOption) {
        if (strikePrice < currentPrice) {
            return 0;
        }
        return ((strikePrice - currentPrice) / priceDecimals) * amount;
    }

    if (!putOption) {
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
    const timeValue = calculateExtrinsicValue(
        amount,
        currentPrice,
        duration,
        volatility,
        priceDecimals
    );
    return intrinsicValue + timeValue;
}

module.exports = {
    calcPremiumOffChain,
    calculateExtrinsicValue,
};

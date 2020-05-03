function calculateLPTokenDelta(amount, poolERC20Balance, poolTotalSupply) {
    return (amount * poolTotalSupply) / poolERC20Balance;
}

module.exports = { calculateLPTokenDelta };
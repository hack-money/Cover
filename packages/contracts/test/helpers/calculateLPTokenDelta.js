function calculateLPTokenDelta(erc20DepositNum, poolERC20Balance, poolTotalSupply) {
    const proportionOfPool = erc20DepositNum / poolERC20Balance;
    return proportionOfPool * poolTotalSupply;
}

module.exports = { calculateLPTokenDelta };
pragma solidity >=0.6.0 <0.7.0;

interface IUniswapOracle {
    function update() external;

    function consult(address token, uint amountIn) external view returns (uint amountOut);
}
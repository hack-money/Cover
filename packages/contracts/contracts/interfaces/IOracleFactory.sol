pragma solidity >=0.6.0 <0.7.0;

import { IUniswapOracle } from "../interfaces/IUniswapOracle.sol";

interface IOracleFactory {
    event OracleCreated(
        address indexed oracle,
        address indexed tokenA,
        address indexed tokenB
    );

    function createOracle(
        address uniswapFactory,
        address poolToken,
        address paymentToken
    ) external returns (IUniswapOracle);
}

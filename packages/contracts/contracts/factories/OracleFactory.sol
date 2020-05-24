pragma solidity >=0.6.0 <0.7.0;

import { ExampleOracleSimple} from '../uniswap/examples/ExampleOracleSimple.sol';
import { IUniswapOracle } from "../interfaces/IUniswapOracle.sol";
import { IOracleFactory } from '../interfaces/IOracleFactory.sol';

contract OracleFactory is IOracleFactory {
    event OracleCreated(address indexed oracle, address indexed tokenA, address indexed tokenB);

    function createOracle(address uniswapFactory, address poolToken, address paymentToken) external override returns (IUniswapOracle) {
        require(uniswapFactory != address(0), 'OracleFactory: ZERO_ADDRESS');
        require(poolToken != address(0), 'OracleFactory: ZERO_ADDRESS');
        require(paymentToken != address(0), 'OracleFactory: ZERO_ADDRESS');

        // Deploy new oracle contract
        ExampleOracleSimple uniswapOracle = new ExampleOracleSimple(uniswapFactory, poolToken, paymentToken);

        emit OracleCreated(address(this), poolToken, paymentToken);
        return IUniswapOracle(uniswapOracle);
    }
}
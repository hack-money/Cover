pragma solidity >=0.6.0 <0.7.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IUniswapV2Factory} from '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import {ILiquidityPoolFactory} from '../interfaces/ILiquidityPoolFactory.sol';

import {LiquidityPool} from '../LiquidityPool.sol';
import { ILiquidityPool } from '../interfaces/ILiquidityPool.sol';


contract LiquidityPoolFactory is ILiquidityPoolFactory {

    event PoolCreated(address indexed poolToken, address pool);

    function createPool(IERC20 poolToken) external override returns (ILiquidityPool) {
        require(address(poolToken) != address(0), 'LiquidityPoolFactory: ZERO_ADDRESS');

        // Deploy new options contract
        LiquidityPool pool = new LiquidityPool(IERC20(poolToken));

        // Transfer ownership to options contract
        pool.transferOwnership(msg.sender);

        emit PoolCreated(address(poolToken), address(pool));
        return pool;
    }
}
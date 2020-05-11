pragma solidity >=0.6.0 <0.7.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ILiquidityPool } from './ILiquidityPool.sol';

interface ILiquidityPoolFactory {
    event PairCreated(address indexed poolToken, address pair);

    function createPool(IERC20 poolToken) external returns (ILiquidityPool pool);
}
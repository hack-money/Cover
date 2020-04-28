pragma solidity >=0.6.0 <0.7.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
* @title Interfaces
* @author Tom Waite, Tom French
* @dev Contract interfaces definitions
* Copyright 2020 Tom Waite, Tom French
 */

interface ILiquidityPool {
    function token() external view returns (IERC20);

    function totalBalance() external view returns (uint256);

    function addLiquidity() external returns (bool);

    function withdrawLiquidity() external returns (bool);

    function getShareOfAssets() external returns (uint256);

}
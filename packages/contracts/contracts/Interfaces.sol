pragma solidity >=0.6.0 <0.7.0;

/**
* @title Interfaces
* @author Tom Waite, Tom French
* @dev Contract interfaces definitions
* Copyright 2020 Tom Waite, Tom French
 */

interface ILiquidityPool {

    function addLiquidity() external returns (bool);

    function withdrawLiquidity() external returns (bool);

    function getShareOfAssets() external returns (uint256);

}
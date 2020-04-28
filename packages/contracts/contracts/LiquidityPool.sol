pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { ILiquidityPool } from './Interfaces.sol';

/**
* @title LiquidityPool
* @author Tom Waite, Tom French
* @dev Base liquidity pool contract, for which users can deposit and withdraw liquidity
* Copyright 2020 Tom Waite, Tom French
 */
contract LiquidityPool is ILiquidityPool, Ownable {
    using SafeMath for uint256;

    constructor() public Ownable() {}

    function addLiquidity() public override returns (bool) {}

    function withdrawLiquidity() public override returns (bool) {}

    function getShareOfAssets() public override returns (uint256) {}

}

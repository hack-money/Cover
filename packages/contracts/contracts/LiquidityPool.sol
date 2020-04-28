pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from 'openzeppelin-solidity/contracts/access/Ownable.sol';
import { SafeMath } from 'openzeppelin-solidity/contracts/math/SafeMath.sol';
/**
* @title LiquidityPool
* @author Tom Waite, Tom French
* @dev Base liquidity pool contract, for which users can deposit and withdraw liquidity
* Copyright 2020 Tom Waite, Tom French
 */
contract LiquidityPool is Ownable {
    using SafeMath for uint256;

    constructor() public Ownable() {}

    function addLiquidity() public returns (bool) {}

    function withdrawLiquidity() public returns (bool) {}

    function getShareOfAssets() public returns (uint256) {}

}

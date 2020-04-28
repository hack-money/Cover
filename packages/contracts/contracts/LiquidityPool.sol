pragma solidity >=0.6.0 <0.7.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
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
    IERC20 public override token;

    constructor(IERC20 _token) public Ownable() {
        token = _token;
    }

    function totalBalance() public view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    function addLiquidity() public override returns (bool) {}

    function withdrawLiquidity() public override returns (bool) {}

    function getShareOfAssets() public override returns (uint256) {}

}

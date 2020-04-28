pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
* @title LiquidityPool
* @author Tom Waite, Tom French
* @dev Base liquidity pool contract, for which users can deposit and withdraw liquidity
* Copyright 2020 Tom Waite, Tom French
 */
contract LiquidityPool is Ownable {
    using SafeMath for uint256;
    address public linkedToken;

    event Deposit(address indexed user, address indexed liquidityPool, uint256 amount);
    event Withdraw(address indexed user, address indexed liquidityPool, uint256 amount);

    // Link the pool to an ERC20 token on deploy
    constructor(address erc20) public Ownable() {
        require(erc20 != address(0x0));
        linkedToken = erc20;   
    }

    /**
    * @dev Add liquidity to the pool. This transfers an `amount` of ERC20 tokens from the user
    * to this smart contract, and simultaneously mints the user a number of LP tokens

    * @param amount Number of ERC20 tokens to transfer to pool
    * @return success statement - bool determining whether liquidity add was successfull
     */
    function deposit(uint256 amount) public returns (bool) {
        require(
            IERC20(linkedToken).transferFrom(msg.sender, address(this), amount),
            'Pool/insufficient user funds to deposit'
        );

        emit Deposit(msg.sender, address(this), amount);
    }

    /**
    * @dev Withdraw liquidity from the pool
    * @param amount Number of ERC20 tokens to withdraw 
    * @return success statement - bool determining whether liquidity withdraw was successfull
     */
    function withdraw(uint256 amount) public returns (bool) {
        require(
            IERC20(linkedToken).transfer(msg.sender, amount),
            'Pool/insufficient user funds to withdraw'
        );

        emit Withdraw(msg.sender, address(this), amount);
    }

    /**
    * @dev Get the number of tokens a user has deposited
     */
    function getUserDeposit(address user) public view returns (uint256) {
        return IERC20(linkedToken).balanceOf(user);
    }


    /**
    * @dev Get the address of the ERC20 token the pool is linked to
     */
    function getLinkedToken() public view returns (address) {
        return linkedToken;
    }


}

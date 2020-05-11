pragma solidity >=0.6.0 <0.7.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ILiquidityPoolFactory } from './interfaces/ILiquidityPoolFactory.sol';

import {Options} from "./Options.sol";
import {State, Option, OptionType} from "./Types.sol";

contract CallOptions is Options {
    constructor(IERC20 poolToken, IERC20 paymentToken, ILiquidityPoolFactory liquidityPoolFactory)
    Options(poolToken, paymentToken, OptionType.Call, liquidityPoolFactory) public {}

    /**
      * @dev Create an option to buy pool tokens at the current price
      *
      * @param duration the period of time for which the option is valid
      * @param amount [placeholder]
      * @return optionID A uint object representing the ID number of the created option.
      */
    function create(uint duration, uint amount) public returns (uint optionID) {
      return create(duration, amount, 103000000);
    }

    /// @dev Exercise an option to claim the pool tokens
    /// @param option The option which is to be exercised
    function _internalExercise(Option memory option, uint optionID) internal override {

        // Take ownership of paymentTokens to be paid into liquidity pool.
        require(
          paymentToken.transferFrom(option.holder, address(this), option.strikeAmount),
          "Insufficient funds"
        );

        exchangeTokens(option.strikeAmount, optionID);
        // pool.sendTokens(option.holder, option.amount);
    }

    /// @dev Lock the collateral for which a created option would be exercised against
    /// @param option The option for which funds are to be locked.
    function _internalLock(Option memory option) internal override {
        pool.lock(option.amount);
    }

    /// @dev Unlocks collateral for option being marked as expired
    /// @param option The expired option for which funds are to be unlocked.
    function _internalUnlock(Option memory option) internal override {
      pool.unlock(option.amount);
    }
}
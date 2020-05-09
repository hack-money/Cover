pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { IUniswapV2Factory } from '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import { IUniswapV2Pair } from '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import { IUniswapV2Router01 } from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol';

import { LiquidityPool } from './LiquidityPool.sol';
import { ILiquidityPool } from './interfaces/ILiquidityPool.sol';

import { IOptions } from './interfaces/IOptions.sol';

import {Option, OptionType, State} from "./Types.sol";

/**
 * @title Option
 * @author Tom Waite, Tom French
 * @dev Base option contract
 * Copyright 2020 Tom Waite, Tom French
 */
contract Options is IOptions, Ownable {
    using SafeMath for uint256;

    Option[] public options; // Array of all created options
    ILiquidityPool public override pool; // Liquidity pool of asset which options will be exercised against
    IERC20 public override paymentToken; // Token for which exercised options will pay in
    IUniswapV2Router01 public override uniswapRouter; // UniswapV2Router01 used to exchange tokens
    OptionType public override optionType; // Does this contract sell put or call options?
    bool internal uniswapInitialised;

    uint constant priceDecimals = 1e8; // number of decimal places in strike price
    uint constant activationDelay = 15 minutes;
    uint256 constant minDuration = 1 days;
    uint256 constant maxDuration = 8 weeks;

    event Create (uint indexed optionId, address indexed account, uint fee, uint premium);
    event Exercise (uint indexed optionId, uint exchangeAmount);
    event Expire (uint indexed optionId);
    event Exchange (uint indexed optionId, address paymentToken, uint inputAmount, address poolToken);
    
    function _internalExercise(Option memory option) internal virtual;
    function _internalUnlock(Option memory option) internal virtual;

    
    constructor(IERC20 poolToken, IERC20 _paymentToken, OptionType t) public {
        pool = new LiquidityPool(poolToken);
        paymentToken= _paymentToken;
        optionType = t;

        initialiseUniswap();
    }

    function initialiseUniswap() public onlyOwner {
        // ropsten addresses
        uniswapRouter = IUniswapV2Router01(0xf164fC0Ec4E93095b804a4795bBe1e041497b92a);
        uniswapInitialised = true;
    }

    function poolToken() public override view returns (IERC20) {
        return pool.linkedToken();
    }

    function getOptionsCount() public view returns(uint) {
        return options.length;
    }

    function fees(/*uint256 duration, uint256 amount, uint256 strikePrice*/) public override pure returns (uint256) {
        return 0;
    }

    /// @dev Exercise an option to claim the pool tokens
    /// @param optionID The ID number of the option which is to be exercised
    function exercise(uint optionID) public override returns (uint256){
        Option storage option = options[optionID];

        require(option.startTime <= now, 'Option has not been activated yet'); // solium-disable-line security/no-block-members
        require(option.expirationTime >= now, 'Option has expired'); // solium-disable-line security/no-block-members
        require(option.holder == msg.sender, "Wrong msg.sender");
        require(option.state == State.Active, "Can't exercise inactive option");

        option.state = State.Exercised;

        _internalExercise(option);

        emit Exercise(optionID, option.amount);
        return option.amount;
    }


    /// @dev Unlocks collateral for an array of expired options.
    ///      This is done as they can no longer be exercised.
    /// @param optionIDs An array of IDs for expired options
    function unlockMany(uint[] memory optionIDs) public override {
        for(uint i; i < optionIDs.length; i++) {
            unlock(optionIDs[i]);
        }
    }


    /// @dev Unlocks collateral for an expired option.
    ///      This is done as it can no longer be exercised.
    /// @param optionID The id number of the expired option.
    function unlock(uint optionID) public override {
        Option storage option = options[optionID];

        // Ensure that option is eligible to be nullified
        require(option.expirationTime < now, "Option has not expired yet");
        require(option.state == State.Active, "Option is not active");

        option.state = State.Expired;

        // Unlocks the assets which this option would have been exercised against
        _internalUnlock(option);

        emit Expire(optionID);
    }

    /// @dev Exchange an amount of payment token into the pool token.
    ///      The pool tokens are then sent to the liquidity pool.
    /// @param inputAmount The amount of payment token to be exchanged
    /// @return exchangedAmount The amount of pool tokens sent to the pool
    function exchangeTokens(uint inputAmount, uint optionId) internal returns (uint) {
      require(inputAmount != uint(0), 'Options/ Swapping 0 tokens');
      // approve router contract to take payment tokens
      paymentToken.approve(address(uniswapRouter), inputAmount);

      address paymentTokenAddress = address(paymentToken);
      address poolTokenAddress = address(pool.linkedToken());

      uint deadline = now + 0.5 days;
      address[] memory path;
      path[0] = paymentTokenAddress;
      path[1] = poolTokenAddress;

      // TODO: calculate a more accurate amountOutMin
      uint[] memory exchangeAmount = uniswapRouter.swapExactTokensForTokens(inputAmount, 0, path, address(pool), deadline);
      require(exchangeAmount.length == 1, 'Options/ Uniswap problem');

      emit Exchange(optionId, paymentTokenAddress, inputAmount, poolTokenAddress);
      return exchangeAmount[0];
    }
}

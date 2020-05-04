pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { LiquidityPool } from './LiquidityPool.sol';
import { ILiquidityPool } from './interfaces/ILiquidityPool.sol';

import {Option, OptionType, State} from "./Types.sol";

/**
 * @title Option
 * @author Tom Waite, Tom French
 * @dev Base option contract
 * Copyright 2020 Tom Waite, Tom French
 */
abstract contract Options is Ownable {
    using SafeMath for uint256;

    Option[] public options; // Array of all created options
    ILiquidityPool public pool; // Liquidity pool of asset which options will be exercised against
    address public paymentToken; // Token for which exercised options will pay in
    OptionType public optionType; // Does this contract sell put or call options?

    uint constant priceDecimals = 1e8; // number of decimal places in strike price
    uint constant activationDelay = 15 minutes;
    uint256 constant minDuration = 1 days;
    uint256 constant maxDuration = 8 weeks;

    event Create (uint indexed optionId, address indexed account, uint fee, uint premium);
    event Exercise (uint indexed optionId, uint exchangeAmount);
    event Expire (uint indexed optionId);

    constructor(address poolToken, address _paymentToken, OptionType t) public {
        pool = new LiquidityPool(poolToken);
        paymentToken= _paymentToken;
        optionType = t;
    }

    function poolToken() public view returns (address) {
        return pool.linkedToken();
    }

    function fees(/*uint256 duration, uint256 amount, uint256 strikePrice*/) public pure returns (uint256) {
        return 0;
    }

    /// @dev Unlocks collateral for an array of expired options.
    ///      This is done as they can no longer be exercised.
    /// @param optionIDs An array of IDs for expired options
    function unlock(uint[] memory optionIDs) public {
        for(uint i; i < optionIDs.length; i++) {
            unlock(optionIDs[i]);
        }
    }


    /// @dev Unlocks collateral for an expired option.
    ///      This is done as it can no longer be exercised.
    /// @param optionID The id number of the expired option.
    function unlock(uint optionID) public {
        Option storage option = options[optionID];

        // Ensure that option is eligible to be nullified
        require(option.expirationTime < now, "Option has not expired yet");
        require(option.state == State.Active, "Option is not active");

        option.state = State.Expired;

        // Unlocks the assets which this option would have been exercised against
        // if(optionType == OptionType.Call) {
        //     pool.unlock(option.amount);
        // } else {
        //     pool.unlock(option.strikeAmount);
        // }

        emit Expire(optionID);
    }
}

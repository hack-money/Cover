pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { ILiquidityPool } from './ILiquidityPool.sol';

import {Option, OptionType, State} from "../Types.sol";

interface IOptions {
    function pool() external view returns (ILiquidityPool);
    function poolToken() external view returns (IERC20);
    function paymentToken() external view returns (IERC20);

    function optionType() external view returns (OptionType);

    event Create (uint indexed optionId, address indexed account, uint fee, uint premium);
    event Exercise (uint indexed optionId, uint exchangeAmount);
    event Expire (uint indexed optionId);

    function create(uint duration, uint amount) external returns (uint);
    
    function exercise(uint optionID) external returns (uint);

    function fees(/*uint256 duration, uint256 amount, uint256 strikePrice*/) external pure returns (uint256);

    function unlockMany(uint[] calldata optionIDs) external;

    function unlock(uint optionID) external;
}

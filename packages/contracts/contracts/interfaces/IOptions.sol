pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { IUniswapV2Router01 } from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol';

import { ILiquidityPool } from './ILiquidityPool.sol';

import {Option, OptionType, State} from "../Types.sol";

interface IOptions {
    event Create (uint indexed optionId, address indexed account, uint fee, uint premium);
    event Exercise (uint indexed optionId, uint exchangeAmount);
    event Expire (uint indexed optionId);
    event Exchange (uint indexed optionId, address paymentToken, uint inputAmount, address poolToken, uint outputAmount);
    event SetUniswapRouter (address indexed uniswapRouter);
    event SetUniswapOracle (address indexed uniswapOracle);
    
    function pool() external view returns (ILiquidityPool);
    function poolToken() external view returns (IERC20);
    function paymentToken() external view returns (IERC20);
    function uniswapRouter() external view returns (IUniswapV2Router01);

    function setUniswapRouter(address _uniswapRouter) external;

    function getOptionInfo(uint optionID) external view returns(address, OptionType, uint, uint, uint, uint, uint);
    
    function getVolatility() external view returns (uint256);
    
    function setVolatility(uint256 _volatility) external;

    function setPlatformPercentageFee(uint256 _platformPercentageFee) external;
    
    function calculateFees(uint256 duration, uint256 amount, uint256 strikePrice, OptionType) view external returns (uint256, uint256);

    function createATM(uint duration, uint amount, OptionType optionType) external returns (uint optionID);
    function create(uint duration, uint amount, uint strikePrice, OptionType optionType) external returns (uint optionID);

    function exercise(uint optionID) external returns (uint256);

    function unlockMany(uint[] calldata optionIDs) external;

    function unlock(uint optionID) external;
}

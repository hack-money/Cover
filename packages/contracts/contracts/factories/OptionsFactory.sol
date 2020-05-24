pragma solidity >=0.6.0 <0.7.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IUniswapV2Factory} from '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import {ILiquidityPoolFactory} from '../interfaces/ILiquidityPoolFactory.sol';
import {IOracleFactory} from '../interfaces/IOracleFactory.sol';
import {IOptionsFactory} from '../interfaces/IOptionsFactory.sol';
import {Options} from '../Options.sol';
import {IOptions} from '../interfaces/IOptions.sol';

contract OptionsFactory is IOptionsFactory {

    IUniswapV2Factory uniswapFactory;
    ILiquidityPoolFactory liquidityPoolFactory;
    IOracleFactory oracleFactory;

    mapping(address => mapping(address => address)) public override getMarket;
    address[] public override allMarkets;

    event MarketCreated(address indexed poolToken, address indexed paymentToken, address market, uint);

    constructor(IUniswapV2Factory _uniswapFactory, ILiquidityPoolFactory _liquidityPoolFactory, IOracleFactory _oracleFactory) public {
        uniswapFactory = _uniswapFactory;
        liquidityPoolFactory = _liquidityPoolFactory;
        oracleFactory = _oracleFactory;
    }

    function allMarketsLength() external view override returns (uint) {
        return allMarkets.length;
    }

    function createMarket(address poolToken, address paymentToken) external override returns (address) {
        require(poolToken != paymentToken, 'OptionsFactory: IDENTICAL_ADDRESSES');
        require(poolToken != address(0), 'OptionsFactory: ZERO_ADDRESS');
        require(paymentToken != address(0), 'OptionsFactory: ZERO_ADDRESS');
        require(getMarket[poolToken][paymentToken] == address(0), 'OptionsFactory: MARKET_EXISTS');
        require(uniswapFactory.getPair(poolToken,paymentToken) != address(0), 'OptionsFactory: Uniswap pair does not exist');

        // Deploy new options contract
        bytes32 salt = keccak256(abi.encode(poolToken, paymentToken));
        Options market = new Options{salt: salt}(IERC20(poolToken), IERC20(paymentToken), liquidityPoolFactory, oracleFactory, uniswapFactory);

        // Store options contract address
        getMarket[poolToken][paymentToken] = address(market);
        allMarkets.push(address(market));
        emit MarketCreated(poolToken, paymentToken, address(market), allMarkets.length);
        return address(market);
    }
}
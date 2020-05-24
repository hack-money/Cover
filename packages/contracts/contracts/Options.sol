pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { IUniswapV2Router01 } from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol';
import { ExampleOracleSimple } from '@uniswap/v2-periphery/contracts/examples/ExampleOracleSimple.sol';

import { LiquidityPool } from './LiquidityPool.sol';
import { ILiquidityPool } from './interfaces/ILiquidityPool.sol';
import { ILiquidityPoolFactory } from './interfaces/ILiquidityPoolFactory.sol';
import { IUniswapOracle } from './interfaces/IUniswapOracle.sol';

import { IOptions } from './interfaces/IOptions.sol';
import { Pricing } from './library/Pricing.sol';

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
    OptionType public optionType; // Does this contract sell put or call options?
    
    uint256 constant priceDecimals = 1e8; // number of decimal places in strike price
    uint256 public platformPercentageFee = 10000; // percentage fee = 1%


    IUniswapV2Router01 public override uniswapRouter; // UniswapV2Router01 used to exchange tokens
    IUniswapOracle public uniswapOracle; // Uniswap oracle for price updates

    uint constant activationDelay = 15 minutes;
    uint256 constant minDuration = 1 days;
    uint256 constant maxDuration = 8 weeks;
    uint256 public volatility = 6;

    event Create (uint indexed optionId, address indexed account, uint fee, uint premium);
    event Exercise (uint indexed optionId, uint exchangeAmount);
    event Expire (uint indexed optionId);
    event Exchange (uint indexed optionId, address paymentToken, uint inputAmount, address poolToken, uint outputAmount);
    event SetUniswapRouter (address indexed uniswapRouter);
    event SetUniswapOracle (address indexed uniswapOracle);
    event TokenPrice (address indexed token, uint256 price);
    
    constructor(IERC20 poolToken, IERC20 _paymentToken, ILiquidityPoolFactory liquidityPoolFactory) public {
        pool = liquidityPoolFactory.createPool(poolToken);
        paymentToken= _paymentToken;

        initialiseUniswap();
    }

    function initialiseUniswap() internal {
        // ropsten addresses
        uniswapRouter = IUniswapV2Router01(0xf164fC0Ec4E93095b804a4795bBe1e041497b92a);

        // TODO: deploy and get address. Oracle has to have been setup and established for a 
        // particular token pair e.g. DAI:USDC
        uniswapOracle = IUniswapOracle(0x01);
    }

    /////////////////// GETTERS AND SETTERS ///////////////////

    /**
    * @dev Get the volatility of the underlying asset.
    * Currently hard coded to Bitmex's EVOL7D index. TODO: dynamically update if possible
    * Note: Represents volatility as a % - need to account for in subsequent arithmetic
    * @return volatility - volatility of option underlying asset
    */
    function getVolatility() public override view returns (uint256) {
        return volatility;
    }

    /**
    * @dev Get the number of options created using this contract
    * @return Number of options created
     */
    function getOptionsCount() public view returns (uint) {
        return options.length;
    }

    /**
    * @dev Get all information about a particular option, specified by the optionID, including: holder, optionType
    * strikeAmount, amount, startTime, expirationTime and premium paid
    * @param optionID - unique identifier for a particular option created
    * @return Specific option information: holder, optionType, strikeAmount, amount, startTime, expirationTime and premium paid
     */
    function getOptionInfo(uint optionID) public override view returns (address, OptionType, uint, uint, uint, uint, uint) {
        Option memory option = options[optionID];
        return (option.holder, option.optionType, option.strikeAmount, option.amount, option.startTime, option.expirationTime, option.premium);
    }

    /**
    * @dev Get information about the ERC20 token linked to the Pool
    * @return Information about the pool's linked token
     */
    function poolToken() public override view returns (IERC20) {
        return pool.linkedToken();
    }


    /**
    * @dev Set the address of the Uniswap router contract. Protected by onlyOwner
    * @param _uniswapRouter - address of the uniswap router contract
     */
    function setUniswapRouter(address _uniswapRouter) public override onlyOwner {
        require(_uniswapRouter != address(0x0), 'Options: ZERO_ADDRESS');
        uniswapRouter = IUniswapV2Router01(_uniswapRouter);
        emit SetUniswapRouter(address(uniswapRouter));
    }

    /**
    * @dev Set the address of the Uniswap price oracle contract. Protected by onlyOwner
    * @param _uniswapOracle - address of the uniswap price oracle contract
     */
    function setUniswapOracle(address _uniswapOracle) public onlyOwner {
        require(_uniswapOracle != address(0x0), 'Options: ZERO_ADDRESS');
        uniswapOracle = IUniswapOracle(_uniswapOracle);
        emit SetUniswapOracle(address(uniswapOracle));
    }

    /**
    * @dev Set the volatility of the option underlying asset. Protected by onlyOwner
    * @param _volatility - set the volatility of the underling option asset
    */
    function setVolatility(uint256 _volatility) public override onlyOwner {
        volatility = _volatility;
    }

    /**
    * @dev Set platform fee percentage. Protected by onlyOwner
    * @param _platformPercentageFee - percentage of the amount taken as a platform fee. Expected to be
     * provider as a 4 digit number, to allow 0.01 percentage points to be specified. 
     *
     * e.g. platformPercentageFee = 125 => 1.25%
     */
    function setPlatformPercentageFee(uint256 _platformPercentageFee)
        public
        override
        onlyOwner
    {
        // check less than 100000 => max fee is 100%
        require(_platformPercentageFee <= 100000, 'Options: PLATFORM_FEE_TOO_HIGH');
        platformPercentageFee = _platformPercentageFee;
    }


    /////////////  EFFECTS AND INTERACTIONS ///////////////
    
    /**
      * @dev Create an option to buy pool tokens
      *
      * @param duration the period of time for which the option is valid
      * @param amount Meaning differs based on whether option is call or put
                      Call: the amount of the pool asset which can be bought at strike price
                      Put: the amount of the payment asset which can be sold at strike price
      * @param optionTypeInput OptionType enum describing whether the option is a call or put
      * @return optionID A uint object representing the ID number of the created option.
      */
    function createATM(uint duration, uint amount, OptionType optionTypeInput) public override returns (uint optionID) {
        return create(duration, amount, 103000000, optionTypeInput);
    }

    /**
      * @dev Create an option to buy pool tokens
      *
      * @param duration the period of time for which the option is valid (days)
      * @param amount Meaning differs based on whether option is call or put
                      Call: the amount of the pool asset which can be bought at strike price
                      Put: the amount of the payment asset which can be sold at strike price (1e18 asset)
      * @param strikePrice the strike price of the option to be created (priceDecimals)
      * @param optionTypeInput OptionType enum describing whether the option is a call or put
      * @return optionID A uint object representing the ID number of the created option.
      */
    function create(uint duration, uint amount, uint strikePrice, OptionType optionTypeInput) public override returns (uint optionID) {
        (uint256 fee, uint256 premium) = calculateFees(duration, amount, strikePrice, optionTypeInput);

        uint strikeAmount = (strikePrice.mul(amount)).div(priceDecimals);

        require(strikeAmount > 0,"Amount is too small");
        require(fee < premium,  "Premium is too small");
        require(duration >= minDuration, "Duration is too short");
        require(duration <= maxDuration, "Duration is too long");

        // Take ownership of paymentTokens to be paid into liquidity pool.
        require(
          paymentToken.transferFrom(msg.sender, address(this), premium.add(fee)),
          "Insufficient funds"
        );

        // Transfer operator fee
        paymentToken.transfer(owner(), fee);

        // solium-disable-next-line security/no-block-members
        Option memory newOption = Option(State.Active, optionTypeInput, msg.sender, strikeAmount, amount, now + activationDelay, now + duration, premium);

        optionID = options.length;
        // Exchange paymentTokens into poolTokens to be added to pool
        exchangeTokens(premium, optionID);

        // Lock collateral which a created option would be exercised against
        _internalLock(newOption);

        options.push(newOption);

        emit Create(optionID, msg.sender, fee, premium);
        return optionID;
    }

    /**
    * @dev Exercise an option to claim the pool tokens
    * @param optionID The ID number of the option which is to be exercised
    * @return Amount exercised
     */
    function exercise(uint optionID) public override returns (uint256){
        Option storage option = options[optionID];

        require(option.startTime <= now, 'Options: Option has not been activated yet'); // solium-disable-line security/no-block-members
        require(option.expirationTime >= now, 'Options: Option has expired'); // solium-disable-line security/no-block-members
        require(option.holder == msg.sender, "Options: Wrong msg.sender");
        require(option.state == State.Active, "Options: Can't exercise inactive option");

        option.state = State.Exercised;

        _internalExercise(option, optionID);

        emit Exercise(optionID, option.amount);
        return option.amount;
    }
    /**
    * @dev Internal option exercise method
    * @param option The option which is to be exercised
    * @param optionID Unique identifier of a particular option
     */ 
    function _internalExercise(Option memory option, uint optionID) internal {
        (uint256 payAmount, uint256 receiveAmount) = (option.optionType == OptionType.Call)
            ? (option.strikeAmount, option.amount) : (option.amount, option.strikeAmount);

        // Take ownership of paymentTokens to be paid into liquidity pool.
        require(
            paymentToken.transferFrom(option.holder, address(this), payAmount),
            "Insufficient funds"
        );

        exchangeTokens(payAmount, optionID);
        pool.sendTokens(option.holder, receiveAmount);
    }
    
    /**
    * @dev Lock collateral which a created option would be exercised against
    * @param option The option for which funds are to be locked.
    */
    function _internalLock(Option memory option) internal {
        if(option.optionType == OptionType.Call){
            pool.lock(option.amount);
        } else {
            pool.lock(option.strikeAmount);
        }
    }

    /**
    * @dev Unlocks collateral for an array of expired options.
    *      This is done as they can no longer be exercised.
    * @param optionIDs An array of IDs for expired options
    */
    function unlockMany(uint[] memory optionIDs) public override {
        for(uint i; i < optionIDs.length; i++) {
            unlock(optionIDs[i]);
        }
    }

    /**
    * @dev Unlocks collateral for an expired option.
    *      This is done as it can no longer be exercised.
    * @param optionID The id number of the expired option.
    */
    function unlock(uint optionID) public override {
        Option storage option = options[optionID];

        // Ensure that option is eligible to be nullified
        require(option.expirationTime < now, "Options: Option has not expired yet");
        require(option.state == State.Active, "Options: Option is not active");

        option.state = State.Expired;

        // Unlocks the assets which this option would have been exercised against
        _internalUnlock(option);

        emit Expire(optionID);
    }

    /** 
    * @dev Unlock collateral which an option is being exercised against
    * @param option The option for which funds are to be unlocked.
    */
    function _internalUnlock(Option memory option) internal {
        if(option.optionType == OptionType.Call){
            pool.unlock(option.amount);
        } else {
            pool.unlock(option.strikeAmount);
        }
    }

    /**
    * @dev Exchange an amount of payment token into the pool token.
    *      The pool tokens are then sent to the liquidity pool.
    * @param inputAmount The amount of payment token to be exchanged
    * @param optionId - unique option identifier, for use in emitting an event and linking
    * the option exercise to the exchange
    * @return exchangedAmount The amount of pool tokens sent to the pool
    */
    function exchangeTokens(uint inputAmount, uint optionId) internal returns (uint) {
      require(inputAmount != uint(0), 'Options: Swapping 0 tokens');
      paymentToken.approve(address(uniswapRouter), inputAmount);

      uint deadline = now + 2 minutes;
      address[] memory path = new address[](2);
      path[0] = address(paymentToken);
      path[1] = address(pool.linkedToken());

      uint[] memory exchangeAmount = uniswapRouter.swapExactTokensForTokens(inputAmount, 0, path, address(pool), deadline);

    //   exchangeAmount[0] = inputAmount
    //   exchangeAmount[i > 0] = subsequent output amounts
      emit Exchange(optionId, address(paymentToken), inputAmount, address(pool.linkedToken()), exchangeAmount[1]);
      return exchangeAmount[1];
    }
    
    /**
    * @dev Calculate the fees associated with an option purchase
    * @param duration Time period until the option expires 
    * @param amount Meaning differs based on whether option is call or put
                      Call: the amount of the pool asset which can be bought at strike price
                      Put: the amount of the payment asset which can be sold at strike price
    * @param strikePrice Price at which the asset can be exercised (priceDecimals)
    * @param optionTypeInput Bool determining whether the option is a put (true) or a call (false)
    * @return platformFee and premium - not multiplied by priceDecimals
    */
    function calculateFees(uint256 duration, uint256 amount, uint256 strikePrice, OptionType optionTypeInput) public override returns (uint256, uint256) {
        // Pool token price in terms of payment token, e.g. 1 DAI = currentPrice USDC
        uint256 currentPrice = getPoolTokenPrice(amount);

        currentPrice = currentPrice.mul(priceDecimals);
        uint256 platformFee = (Pricing.calculatePlatformFee(amount, platformPercentageFee)).mul(currentPrice).div(priceDecimals);
        uint256 premium = Pricing.calculatePremium(strikePrice, amount, duration, currentPrice, getVolatility(), int(optionTypeInput), priceDecimals);
        return (platformFee, premium);
    }

    /**
    * @dev Get the current price of the poolToken - DAI.
    * @param amount Number of pool tokens user is purchasing a right over
    * @return Number of paymentTokens that would be exchanged if the trade between
    * amount of tokenA, for tokenB were to go ahead
    **/
    function getPoolTokenPrice(uint256 amount) public returns (uint256) {
        // TODO: automate the calling of oracle.update() every 24hrs
        // returns number of USDC tokens that would be exchanged for the `amount` of DAI tokens
        uint256 amountPoolTokenOut = uniswapOracle.consult(address(pool.linkedToken()), amount);
        
        // DAI price in terms of USDC
        uint256 poolTokenPrice = amountPoolTokenOut.div(amount);
        
        emit TokenPrice(address(pool.linkedToken()), poolTokenPrice);
        return poolTokenPrice;
    }
}

pragma solidity >=0.6.0 <0.7.0;

import {Pricing} from '../library/Pricing.sol';

contract PricingTest {
    /**
     * @dev Computes the premium charged on the option. Option price = intrinsic value + time value. Note: platform
     * fee not included in this calculation, accounted for seperately
     * @param strikePrice - price at which the underlying asset is bought/sold when the option is exercised (priceDecimals)
     * @param amount - amount of the asset for which an option is being purchased
     * @param duration - time period until expiry of the option
     * @param currentPrice - current price of the underlying asset
     * @param putOption - specification of whether the option is a PUT or CALL. `true` is a Put, `false` is a CALL
     * @return premium - amount a user has to pay to buy the option. Not multiplied by priceDecimals
     */
    function calculatePremium(
        uint256 strikePrice,
        uint256 amount,
        uint256 duration,
        uint256 currentPrice,
        uint256 volatility,
        int256 putOption,
        uint256 priceDecimals
    ) public pure returns (uint256) {
        return Pricing.calculatePremium(strikePrice, amount, duration, currentPrice, volatility, putOption, priceDecimals);
    }

    /**
     * @dev Compute the time value component of an option price. Uses an approximation to the Black Scholes equation
     * @param amount - quantity which the option represents
     * @param currentPrice - price of the underlying asset
     * @param duration - time period of the option (seconds)
     * @param volatility - measure of the volatility of the underlying asset
     * @return Time value of the option, number divided by price decimals
     */
    function calculateExtrinsicValue(
        uint256 amount,
        uint256 currentPrice,
        uint256 duration,
        uint256 volatility
    ) public pure returns (uint256) {
      return Pricing.calculateExtrinsicValue(amount, currentPrice, duration, volatility);
    }

    /**
     * @dev Calculate the total intrinsic value of the option
     * @param strikePrice - underlying asset price at which option can be exercised
     * @param amount - quantity for which the option represents
     * @param currentPrice - current market price of underlying asset
     * @param optionTypeInput - option definition. Put option if 1, call option if 0
     * @return Total intrinsic value of whole option amount. Number divided by priceDecimals
     */
    function calculateIntrinsicValue(
        uint256 strikePrice,
        uint256 amount,
        uint256 currentPrice,
        int256 optionTypeInput
    ) public pure returns (uint256) {
        return Pricing.calculateIntrinsicValue(strikePrice, amount, currentPrice, optionTypeInput);
    }

    /**
     * @dev Compute platform fee for providing the option. Calculated as a percentage of the
     * option amount
     * @param amount quantity of asset for which option is being purchased
     * @param platformPercentageFee - percentage of the amount taken as a platform fee. Expected to be
     * provider as a 4 digit number, to allow 0.01 percentage points to be specified.
     *
     * e.g. platformPercentageFee = 125 => 1.25%
     */
    function calculatePlatformFee(uint256 amount, uint256 platformPercentageFee)
        public
        pure
        returns (uint256)
    {
        return Pricing.calculatePlatformFee(amount, platformPercentageFee);
    }

    /**
     * @dev Compute the square root of a value. Uses the Babylonian method of calculating a square root
     * 
     * Sources: 1) https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity
     *          2) https://github.com/ethereum/dapp-bin/pull/50
     *
     * @param value - Value to be square rooted
     * @return square rooted value

     */
    function squareRoot(uint256 value) public pure returns (uint256) {
        return Pricing.squareRoot(value);
    }
}
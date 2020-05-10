pragma solidity >=0.6.0 <0.7.0;

library Pricing {
    /**
    * @dev Computes the premium charged on the option. Option price = intrinsic value + time value
    * @param strikePrice - price at which the underlying asset is bought/sold when the option is exercised
    * @param amount
    * @param duration
    * @param underlyingPrice
    * @param optionType - specification of whether the option is a PUT or CALL. `true` is a Put, `false` is a CALL
     */
    function calculatePremium(uint256 strikePrice, uint256 amount, uint256 duration, uint underlyingPrice, bool optionType) public view returns (uint256) {
        uint256 volatility = getVolatility();
        uint256 intrinsicValue = uint256(0);

         // intrinsic value per unit, multiplied by number of units
        if (optionType.PUT) {
            intrinsicValue = (strikePrice.sub(underlyingPrice)).mul(amount);
        } else if (optionType.CALL) {
            intrinsicValue = (underlyingPrice.sub(strikePrice)).mul(amount);
        }

        uint256 timeValue = calculateTimeValue(underlyingPrice, duration, volatility);
        return intrinsicValue.add(timeValue);
    }

    /**
    * @dev Compute the time value component of an option price. Uses an approximation to the Black Scholes equation
    * @param underlyingPrice - price of the underlying asset
    * @param duration - time period of the option
    * @param volatility - measure of the volatility of the underlying asset
     */
    function calculateTimeValue(uint256 underlyingPrice, uint256 duration, uint256 volatility) public returns (uint256) {
        // https://quant.stackexchange.com/questions/1150/what-are-some-useful-approximations-to-the-black-scholes-formula
        // Note: only works well for short duration periods
        // premium = 0.4 * underlyingAsset price * volatility * sqrt(duration)
        return (uint256(4).mul(underlyingPrice).mul(volatility).mul(squareRoot(duration))).div(100);
    }

    /**
    * @dev Compute the square root of a value. Uses the Babylonian method of calculating a square root
    * @param value - Value to be square rooted
    * @return square rooted value
     */
    function squareRoot(uint256 value) internal pure returns (uint256) {
        // https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity
        uint256 z = (value.add(1)).div(2);
        uint256 y = value;
        while (z < y) {
            y = z;
            uint256 fraction = value.div(z.add(z));
            z = fraction.div(2);
        }
        return y;
    }

    /// @dev Computes platform fee for providing the option. Calculated as 1% of the 
    /// amount for which an option is purchased
    function calculatePlatformFee(uint256 amount) public view returns (uint256) {
        uint256 platformPercentage = 1;
        return (amount.mul(platformPercentage)).div(100);
    }

    /// @dev Get the volatility of the underlying asset
    function getVolatility() public view returns (uint256) {
        return 5;
    }
}
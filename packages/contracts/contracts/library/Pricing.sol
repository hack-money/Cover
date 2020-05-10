pragma solidity >=0.6.0 <0.7.0;

import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';

library Pricing {
    using SafeMath for uint256;
    using SafeMath for uint;
    
    /**
    * @dev Computes the premium charged on the option. Option price = intrinsic value + time value
    * @param strikePrice - price at which the underlying asset is bought/sold when the option is exercised
    * @param amount - amount of the asset for which an option is being purchased
    * @param duration - time period until expiry of the option
    * @param underlyingPrice - current price of the underlying asset
    * @param putOption - specification of whether the option is a PUT or CALL. `true` is a Put, `false` is a CALL
    * @return premium - amount a user has to pay to buy the option
     */
    function calculatePremium(uint256 strikePrice, uint256 amount, uint256 duration, uint underlyingPrice, bool putOption) public view returns (uint256) {
        uint256 volatility = getVolatility();
        uint256 intrinsicValue = uint256(0);

         // intrinsic value per unit, multiplied by number of units
        if (putOption) {
            intrinsicValue = (strikePrice.sub(underlyingPrice)).mul(amount);
        } else if (!putOption) {
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
    * @return time value of the option
     */
    function calculateTimeValue(uint256 underlyingPrice, uint256 duration, uint256 volatility) public pure returns (uint256) {
        // https://quant.stackexchange.com/questions/1150/what-are-some-useful-approximations-to-the-black-scholes-formula
        // Note: only works well for `short` duration periods
        // premium = 0.4 * underlyingAsset price * volatility * sqrt(duration)
        return (uint256(4).mul(underlyingPrice).mul(volatility).mul(squareRoot(duration))).div(100);
    }

    /**
    * @dev Compute the square root of a value. Uses the Babylonian method of calculating a square root
    * @param value - Value to be square rooted
    * @return square rooted value
     */
    function squareRoot(uint256 value) public pure returns (uint256) {
        // Sources: 1) https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity
        // 2) https://github.com/ethereum/dapp-bin/pull/50 
        
        require(value != uint(0), 'Pricing: can not sqrt 0');

        if (value > 3) {
            uint256 z = (value + 1) / 2;
            uint256 y = value;
            while (z < y) {
                y = z;
                z = (value / z + z) / 2;
            }
            return y;
        } else {
            return 1;
        }
    }

    /**
    * @dev Compute platform fee for providing the option. Calculated as 1% of the 
    * amount for which an option is purchased 
    * @param amount quantity of asset for which option is being purchased
     */
    function calculatePlatformFee(uint256 amount) public pure returns (uint256) {
        uint256 platformPercentage = 1;
        return (amount.mul(platformPercentage)).div(100);
    }

    /**
    * @dev Get the volatility of the underlying asset
    * @return volatility of the underlying asset
    */
    function getVolatility() public view returns (uint256) {
        return 5;
    }
}
pragma solidity >=0.6.0 <0.7.0;

import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

library Pricing {
    using SafeMath for uint256;

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
        uint256 intrinsicValue = calculateIntrinsicValue(
            strikePrice,
            amount,
            currentPrice,
            putOption
        );
        uint256 extrinsicValue = calculateExtrinsicValue(
            amount,
            currentPrice,
            duration,
            volatility
        );
        return intrinsicValue.add(extrinsicValue).div(priceDecimals);
    }

    /**
     * @dev Compute the time value component of an option price. Uses an approximation to the Black Scholes equation
     * @param amount - [placeholder]
     * @param currentPrice - price of the underlying asset
     * @param duration - time period of the option (days)
     * @param volatility - measure of the volatility of the underlying asset (?)
     * @return Time value of the option, number divided by price decimals
     */
    function calculateExtrinsicValue(
        uint256 amount,
        uint256 currentPrice,
        uint256 duration,
        uint256 volatility
    ) public pure returns (uint256) {
        /**
        * https://quant.stackexchange.com/questions/1150/what-are-some-useful-approximations-to-the-black-scholes-formula
        * Assumptions: `short` duration periods, constant volatility of underlying asset, option close to the money
        * premium = 0.4 * underlyingAsset price * volatility * sqrt(duration)

        * Explanation of various divisors
        * - div(10) to account for 0.4 being represented as an integer
        * - div(100) to account for vol being represented as an integer when it's actually a percentage
        *
         */
        uint256 resultOfMuls = uint256(4)
            .mul(currentPrice)
            .mul(volatility)
            .mul(squareRoot(duration))
            .mul(amount);
        return resultOfMuls.div(10).div(100);
    }

    /**
     * @dev Calculate the total intrinsic value of the option
     * @return Total intrinsic value of whole option amount. Number divided by priceDecimals
     */
    function calculateIntrinsicValue(
        uint256 strikePrice,
        uint256 amount,
        uint256 currentPrice,
        int256 putOption
    ) public pure returns (uint256) {
        // intrinsic value per unit, multiplied by number of units
        if (putOption == 1) {
            if (strikePrice < currentPrice) {
                return 0; // if intrinsicValue is negative, return 0
            } else {
                return
                    (strikePrice.sub(currentPrice)).mul(amount)
                    ; // intrinsicValue = (strikePrice - currentPrice) * amount
            }
        }

        if (putOption == 0) {
            if (currentPrice < strikePrice) {
                return 0; // if intrinsicValue is negative, return 0
            } else {
                return
                    (currentPrice.sub(strikePrice)).mul(amount); // intrinsicValue = (currentPrice - strikePrice) * amount
            }
        }
    }

    // TODO: factor in current price into this, only returns amount in terms of the amount of option
    /**
     * @dev Compute platform fee for providing the option. Calculated as 1% of the
     * amount for which an option is purchased
     * @param amount quantity of asset for which option is being purchased
     */
    function calculatePlatformFee(uint256 amount, uint256 platformPercentageFee)
        public
        pure
        returns (uint256)
    {
        return (amount.mul(platformPercentageFee)).div(100);
    }

    /**
     * @dev Compute the square root of a value. Uses the Babylonian method of calculating a square root
     * @param value - Value to be square rooted
     * @return square rooted value
     */
    function squareRoot(uint256 value) public pure returns (uint256) {
        // Sources: 1) https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity
        // 2) https://github.com/ethereum/dapp-bin/pull/50

        require(value != uint256(0), 'Pricing: can not sqrt 0');

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
}

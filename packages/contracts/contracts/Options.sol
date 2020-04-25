pragma solidity ^0.6.6;
import "./ERCPool.sol";

/**
 * @title Options Contract
 * @author Holly Wintermute (Hegic)
 * @author Tom French
 * 
 * Copyright 2020 Tom French
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

abstract contract Options is Ownable, SpreadLock {
  using SafeMath for uint;

  Option[] public options;
  uint public impliedVolRate = 20000;
  uint public maxSpread = 95;//%
  uint constant priceDecimals = 1e8;
  uint constant activationTime = 15 minutes;
  AggregatorInterface public priceProvider;
  IUniswapFactory public exchanges;
  IERC20 paymentToken;
  IERC20 poolToken;
  IERCLiquidityPool public pool;
  OptionType private optionType;
  bool public override highSpreadLockEnabled;


  constructor(IERC20 DAI, IERC20 USDC, AggregatorInterface pp, IUniswapFactory ex, OptionType t) public {
    paymentToken = USDC;
    poolToken = DAI;
    priceProvider = pp;
    exchanges = ex;
    optionType = t;
  }

  function setImpliedVolRate(uint value) public onlyOwner {
    require(value >= 10000, "ImpliedVolRate limit is too small");
    impliedVolRate = value;
  }

  function setMaxSpread(uint value) public onlyOwner {
    require(value <= 95, "Spread limit is too large");
    maxSpread = value;
  }

  event Create (uint indexed id, address indexed account, uint fee, uint premium);
  event Exercise (uint indexed id, uint exchangeAmount);
  event Expire (uint indexed id);
  enum State { Active, Exercised, Expired }
  enum OptionType { Put, Call }
  struct Option {
    State state;
    address payable holder;
    uint strikeAmount;
    uint amount;
    uint expiration;
    uint activation;
  }

  /// @dev calculates a 1% fee to be sent to the contract owner.
  /// @return fee a uint representing the fee sent directly to owner
  function getOwnerFee(uint amount) internal pure returns (uint fee) { fee = amount / 100; }

  function getPeriodFee(uint amount, uint period, uint strike, uint currentPrice) internal view returns (uint fee) {
    fee = amount.mul(sqrt(period / 10)).mul( impliedVolRate ).mul(strike).div(currentPrice).div(1e8);
  }

  /// @dev calculates a fee to account for slippage.
  /// @return fee a uint representing the slippage fee
  function getSlippageFee(uint amount) internal pure returns (uint fee){
    if(amount > 10 ether) fee = amount.mul(amount) / 1e22;
  }

  /// @dev negates any profit if a user attempts to create an option which would immediately be profitable.
  /// @return fee a uint equal to the maximum of either 0 or the profit incurred by immediately exercising the option.
  function getStrikeFee(uint amount, uint strike, uint currentPrice) internal view returns (uint fee) {
    if(strike > currentPrice && optionType == OptionType.Put)  fee = (strike - currentPrice).mul(amount).div(currentPrice);
    if(strike < currentPrice && optionType == OptionType.Call) fee = (currentPrice - strike).mul(amount).div(currentPrice);
  }

  /**
  * @dev calculates the fee required for a particular option
  *
  * @param period the period of time for which the option is valid
  * @param amount [placeholder]
  * @param strike the strike price of the option to be created
  * @return premium The total fee to be paid upon taking out this option
  * @return ownerFee see ownerFee function
  * @return strikeFee see strikeFee function
  * @return slippageFee see slippageFee function
  * @return periodFee see periodFee function
  */
  function fees(uint period, uint amount, uint strike) public view
    returns (uint premium, uint ownerFee, uint strikeFee, uint slippageFee, uint periodFee) {
      // TODO: We can likely get by without an oracle seeing as we deal with stablecoins
      // At least we switch to using uniswap v2 as oracle.
      uint currentPrice = uint(priceProvider.latestAnswer());
      ownerFee = getOwnerFee(amount);
      periodFee = getPeriodFee(amount, period, strike, currentPrice);
      slippageFee = getSlippageFee(amount);
      strikeFee = getStrikeFee(amount, strike, currentPrice);
      premium = periodFee.add(slippageFee).add(strikeFee);
  }

  /// @dev Unlocks collateral an expired option.
  ///      This is done as it can no longer be exercised.
  /// @param optionIDs An array of IDs for expired options
  function unlock(uint[] memory optionIDs) public {
    for(uint i; i < optionIDs.length; unlock(optionIDs[i++])){}
  }


  /// @dev Unlocks collateral an expired option.
  ///      This is done as it can no longer be exercised.
  /// @param optionID The id number of the expired option for which the collateral is to be unlocked
  function unlock(uint optionID) public {
      Option storage option = options[optionID];
      require(option.expiration < now, "Option has not expired yet");
      require(option.state == State.Active, "Option is not active");

      option.state = State.Expired;

      if(optionType == OptionType.Call) pool.unlock(option.amount);
      else pool.unlock(option.strikeAmount);

      emit Expire(optionID);
  }

  /// @dev Calculates the square root of a number
  /// @param x the number to be square rooted
  /// @return y such that x = y^2 (to a good approximation)
  function sqrt(uint x) private pure returns (uint y) {
    y = x;
    uint z = (x + 1) / 2;
    while (z < y) (y, z) = (z, (x / z + z) / 2);
  }
}

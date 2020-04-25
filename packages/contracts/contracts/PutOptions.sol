pragma solidity ^0.6.6;
import "./Options.sol";

/**
 * @title Put Options contract
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

contract PutOptions is Options {
  constructor(IERC20 DAI, IERC20 USDC, AggregatorInterface pp, IUniswapFactory ex)
    Options(DAI, USDC, pp, ex, Options.OptionType.Put) public {
      pool = new ERCPool(DAI);
  }

  /// @dev Exchanges the contract's current payment token balance into the pool token.
  ///      The pool tokens are then sent to the liquidity pool.
  /// @return exchangedAmount The amount of pool tokens sent to the pool
  function exchange() public returns (uint) { return exchange(paymentToken.balanceOf(address(this))); }


  /// @dev Exchange an amount of payment token into the pool token.
  ///      The pool tokens are then sent to the liquidity pool.
  /// @param amount The amount of payment token to be exchanged
  /// @return exchangedAmount The amount of pool tokens sent to the pool
  function exchange(uint amount) public returns (uint exchangedAmount) {
    // TODO: switch to using uniswap V2 to exchange tokens
    UniswapExchangeInterface ex = exchanges.getExchange(paymentToken);
    exchangedAmount = ex.tokenToTokenTransferInput(amount, 1, 1, now + 1 minutes, address(pool), address(pool.token()));
    // uint exShare = ex.getEthToTokenInputPrice(1 ether); //e18
    // if( exShare > maxSpread.mul(uint(priceProvider.latestAnswer())).mul(1e8) ){
    //   highSpreadLockEnabled = false;
    //   exchangedAmount = ex.tokenToTokenTransferInput(amount, 1, 1, now + 1 minutes, address(pool), address(pool.token));
    // }
    // else {
    //   highSpreadLockEnabled = true;
    // }
  }


  /**
    * @dev Create an option to buy pool tokens at the current price
    *
    * @param period the period of time for which the option is valid
    * @param amount [placeholder]
    * @return optionID A uint object representing the ID number of the created option.
    */
  function create(uint period, uint amount) public returns (uint optionID) {
    return create(period, amount, uint(priceProvider.latestAnswer()));
  }


  /**
    * @dev Create an option to buy pool tokens
    *
    * @param period the period of time for which the option is valid
    * @param amount [placeholder]
    * @param strike the strike price of the option to be created
    * @return optionID A uint object representing the ID number of the created option.
    */
  function create(uint period, uint amount, uint strike) public returns (uint optionID) {
      (uint premium, uint fee,,,) = fees(period, amount, strike);
      uint strikeAmount = strike.mul(amount) / priceDecimals;

      require(strikeAmount > 0,"Amount is too small");
      require(fee < premium,  "Premium is too small");
      require(period >= 1 days,"Period is too short");
      require(period <= 8 weeks,"Period is too long");
      require(
        paymentToken.transferFrom(msg.sender, address(this), premium),
        "Insufficient funds"
      );

      paymentToken.transfer(owner(), fee);
      exchange();
      pool.lock(strikeAmount);
      optionID = options.length;
      options.push(Option(State.Active, msg.sender, strikeAmount, amount, now + period, now + activationTime));

      emit Create(optionID, msg.sender, fee, premium);
  }

  /// @dev Exercise an option to claim the pool tokens
  /// @param optionID The ID number of the option which is to be exercised
  function exercise(uint optionID) public payable {
      Option storage option = options[optionID];

      require(option.expiration >= now, 'Option has expired');
      require(option.activation <= now, 'Option has not been activated yet');
      require(option.holder == msg.sender, "Wrong msg.sender");
      require(option.state == State.Active, "Wrong state");

      require(
        paymentToken.transferFrom(option.holder, address(this), option.amount),
        "Insufficient funds"
      );

      option.state = State.Expired;

      uint amount = exchange();
      pool.send(option.holder, option.strikeAmount);
      emit Exercise(optionID, amount);
  }
}

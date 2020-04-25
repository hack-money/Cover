pragma solidity ^0.6.6;
import "./Interfaces.sol";

/**
 * @title ERC20 Liquidity Pool
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

contract ERCPool is IERCLiquidityPool, Ownable, ERC20("DAI LP Token", "writeDAI"){
  using SafeMath for uint256;
  uint public lockedAmount;
  IERC20 public override token;

  constructor(IERC20 _token) public { token = _token; }

  /// @dev Returns unlocked balance of pool.
  /// @return balance Unlocked balance of pool.
  function availableBalance() public view returns (uint balance) {balance = totalBalance().sub(lockedAmount);}
  
  /// @dev Returns balance of pool.
  /// @return balance total balance of pool.
  function totalBalance() public override view returns (uint balance) { balance = token.balanceOf(address(this));}

  
  /// @dev provides liquidity to the pool
  /// @param amount the number of tokens which are to be added to the pool
  /// @param minMint the minimum number of LP tokens which must be minted in order to succeed  
  /// @return mint the number of LP tokens minted  
  function provide(uint amount, uint minMint) public returns (uint mint) {
    mint = provide(amount);
    require(mint >= minMint, "Pool: Mint limit is too large");
  }

  /// @dev provides liquidity to the pool
  /// @param amount the number of tokens which are to be added to the pool
  /// @return mint the number of LP tokens minted  
  function provide(uint amount) public returns (uint mint) {
    require(!SpreadLock(owner()).highSpreadLockEnabled(), "Pool: Locked");
    if(totalSupply().mul(totalBalance()) == 0)
      mint = amount.mul(1000);
    else
      mint = amount.mul(totalSupply()).div(totalBalance());

    require(mint > 0, "Pool: Amount is too small");
    emit Provide(msg.sender, amount, mint);
    require(
      token.transferFrom(msg.sender, address(this), amount),
      "Insufficient funds"
    );
    _mint(msg.sender, mint);
  }


  /// @dev withdraws liquidity from the pool
  /// @param amount the number of tokens which are to be withdrawn from the pool
  /// @param maxBurn the max number of LP tokens which can be burned in order to succeed
  /// @return burn the number of LP tokens burned
  function withdraw(uint amount, uint maxBurn) public returns (uint burn) {
    burn = withdraw(amount);
    require(burn <= maxBurn, "Pool: Burn limit is too small");
  }


  /// @dev withdraws liquidity from the pool
  /// @param amount the number of tokens which are to be withdrawn from the pool
  /// @return burn the number of LP tokens burned
  function withdraw(uint amount) public returns (uint burn) {
    require(amount <= availableBalance(), "Pool: Insufficient unlocked funds");
    burn = amount.mul(totalSupply()).div(totalBalance());
    require(burn <= balanceOf(msg.sender), "Pool: Amount is too large");
    require(burn > 0, "Pool: Amount is too small");
    _burn(msg.sender, burn);
    emit Withdraw(msg.sender, amount, burn);
    require(
      token.transfer(msg.sender, amount),
      "Insufficient funds"
    );
  }

  /// @dev calculates the user's share of the total supply of LP tokens
  /// @param user the address of which to calculate the share of
  function shareOf(address user) public view returns (uint share){
    if(totalBalance() > 0) share = totalBalance()
      .mul(balanceOf(user))
      .div(totalSupply());
  }

  /// @dev locks a number of tokens in the pool
  /// @param amount the number of tokens to lock
  function lock(uint amount) public override onlyOwner {
    require(
      lockedAmount.add(amount).mul(10).div( totalBalance() ) < 8,
      "Pool: Insufficient unlocked funds" );
    lockedAmount = lockedAmount.add(amount);
  }

  
  /// @dev unlocks a number of tokens in the pool
  /// @param amount the number of tokens to unlock
  function unlock(uint amount) public override onlyOwner {
    require(lockedAmount >= amount, "Pool: Insufficient locked funds");
    lockedAmount = lockedAmount.sub(amount);
  }

  
  /// @dev send tokens from the pool to an address
  /// @param to the address which to send tokens to
  /// @param amount the number of tokens to send
  function send(address payable to, uint amount) public override onlyOwner {
    require(lockedAmount >= amount, "Pool: Insufficient locked funds");
    lockedAmount -= amount;
    require(
      token.transfer(to, amount),
      "Insufficient funds"
    );
  }
}

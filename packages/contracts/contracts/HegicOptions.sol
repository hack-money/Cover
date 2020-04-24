pragma solidity ^0.6.6;
import "./HegicERCPool.sol";

abstract contract HegicOptions is Ownable, SpreadLock {
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

  function getHegicFee(uint amount) internal pure returns (uint fee) { fee = amount / 100; }

  function getPeriodFee(uint amount, uint period, uint strike, uint currentPrice) internal view returns (uint fee) {
    fee = amount.mul(sqrt(period / 10)).mul( impliedVolRate ).mul(strike).div(currentPrice).div(1e8);
  }

  function getSlippageFee(uint amount) internal pure returns (uint fee){
    if(amount > 10 ether) fee = amount.mul(amount) / 1e22;
  }

  function getStrikeFee(uint amount, uint strike, uint currentPrice) internal view returns (uint fee) {
    if(strike > currentPrice && optionType == OptionType.Put)  fee = (strike - currentPrice).mul(amount).div(currentPrice);
    if(strike < currentPrice && optionType == OptionType.Call) fee = (currentPrice - strike).mul(amount).div(currentPrice);
  }

  function fees(uint period, uint amount, uint strike) public view
    returns (uint premium, uint hegicFee, uint strikeFee, uint slippageFee, uint periodFee) {
      // TODO: We can likely get by without an oracle seeing as we deal with stablecoins
      // At least we switch to using uniswap v2 as oracle.
      uint currentPrice = uint(priceProvider.latestAnswer());
      hegicFee = getHegicFee(amount);
      periodFee = getPeriodFee(amount, period, strike, currentPrice);
      slippageFee = getSlippageFee(amount);
      strikeFee = getStrikeFee(amount, strike, currentPrice);
      premium = periodFee.add(slippageFee).add(strikeFee);
  }

  function unlock(uint[] memory optionIDs) public {
    for(uint i; i < options.length; unlock(optionIDs[i++])){}
  }

  function unlock(uint optionID) internal {
      Option storage option = options[optionID];
      require(option.expiration < now, "Option has not expired yet");
      require(option.state == State.Active, "Option is not active");

      option.state = State.Expired;

      if(optionType == OptionType.Call) pool.unlock(option.amount);
      else pool.unlock(option.strikeAmount);

      emit Expire(optionID);
  }

  function sqrt(uint x) private pure returns (uint y) {
    y = x;
    uint z = (x + 1) / 2;
    while (z < y) (y, z) = (z, (x / z + z) / 2);
  }
}

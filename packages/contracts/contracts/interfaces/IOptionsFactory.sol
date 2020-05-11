pragma solidity >=0.6.0 <0.7.0;

interface IOptionsFactory {
    event MarketCreated(address indexed poolToken, address indexed paymentToken, address market, uint);

    function getMarket(address poolToken, address paymentToken) external view returns (address market);
    function allMarkets(uint) external view returns (address market);
    function allMarketsLength() external view returns (uint);

    function createMarket(address poolToken, address paymentToken) external returns (address market);
}
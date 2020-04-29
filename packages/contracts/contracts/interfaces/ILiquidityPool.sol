pragma solidity >=0.6.0 <0.7.0;

interface ILiquidityPool {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function getUserLPBalance(address user) view external returns (uint256);

    function getPoolERC20Balance() external view returns (uint256);
    
    function getLinkedToken() external view returns (address);
}
pragma solidity >=0.6.0 <0.7.0;

interface ILiquidityPool {
    function addLiquidity(uint256 amount) external returns (bool);

    function withdrawLiquidity() external returns (bool);

    function getShareOfAssets() external returns (uint256);

    function getLinkedToken() external view returns (address);
    
    function getUserDeposit() external view returns (uint256);
}
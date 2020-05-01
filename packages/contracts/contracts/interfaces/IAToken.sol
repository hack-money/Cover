pragma solidity >=0.6.0 <0.7.0;

interface IAToken {
    function redirectInterestStream(address _to) external;

    function redirectInterestStreamOf(address _from, address _to) external;
    
    function allowInterestRedirectionTo(address _to) external;

    function redeem(uint256 _amount) external;

    function mintOnDeposit(address _account, uint256 _amount) external;

    function burnOnLiquidation(address _account, uint256 _value) external;

    function transferOnLiquidation(address _from, address _to, uint256 _value) external;

    function balanceOf(address _user) external view returns(uint256);

    function principalBalanceOf(address _user) external view returns(uint256);

    function totalSupply() external view returns(uint256);

    function isTransferAllowed(address _user, uint256 _amount) external view returns (bool);

    function getUserIndex(address _user) external view returns(uint256);

    function getInterestRedirectionAddress(address _user) external view returns(address);

    function getRedirectedBalance(address _user) external view returns(uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);
}
pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import { ILendingPoolAddressesProvider } from "./interfaces/ILendingPoolAddressesProvider.sol";
import { ILendingPool } from "./interfaces/ILendingPool.sol";
import { ILiquidityPool } from './interfaces/ILiquidityPool.sol';
import { IAToken } from './interfaces/IAToken.sol';

/**
* @title LiquidityPool
* @author Tom Waite, Tom French
* @dev Base liquidity pool contract, for which users can deposit and withdraw liquidity
* Copyright 2020 Tom Waite, Tom French
 */
contract LiquidityPool is ILiquidityPool, ERC20, Ownable {
    using SafeMath for uint256;
    
    IERC20 override public linkedToken;

    // Aave contracts
    ILendingPoolAddressesProvider aaveProvider;
    ILendingPool aaveLendingPool;
    IAToken aTokenInstance;
    uint16 constant private referral = 0;
    bool private aaveInitialised;

    event Deposit(address indexed user, address indexed liquidityPool, uint256 amount);
    event Withdraw(address indexed user, address indexed liquidityPool, uint256 amount);
    event DepositAave(address indexed owner, uint256 transferAmount);
    event RedeemAave(address indexed owner, uint256 redeemAmount);

    constructor(IERC20 erc20) public ERC20('DAIPoolLP', 'DAILP') Ownable() {
        linkedToken = erc20;
    }

    function initialiseAave() public onlyOwner {
        // ropsten addresses
        address aaveLendingPoolAddressesProvider = 0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728;
        
        aaveProvider = ILendingPoolAddressesProvider(aaveLendingPoolAddressesProvider);
        aaveLendingPool = ILendingPool(aaveProvider.getLendingPool());

        (,,,,,,,,,,,address aTokenAddress,) = aaveLendingPool.getReserveData(address(linkedToken));
        aTokenInstance = IAToken(aTokenAddress);

        aaveInitialised = true;
    }

    /**
    * @dev Add liquidity to the pool. This transfers an `amount` of ERC20 tokens from the user
    * to this smart contract, and simultaneously mints the user a number of LP tokens

    * @param amount Number of ERC20 tokens to transfer to pool
     */
    function deposit(uint256 amount) public override {
        require(amount != uint256(0), 'Pool/can not deposit 0');

        uint256 numLPTokensToMint;
        if (totalSupply() == 0) {
            numLPTokensToMint = amount.mul(1000);
        } else {
            numLPTokensToMint = (amount.mul(totalSupply())).div(getPoolERC20Balance());
        }

        _mint(msg.sender, numLPTokensToMint);

        require(
            linkedToken.transferFrom(msg.sender, address(this), amount),
            'Pool/insufficient user funds to deposit'
        );

        emit Deposit(msg.sender, address(this), amount);
    }

    /**
    * @dev Transfer an amount of this pool's funds to the Aave pool and receive
    * aTokens in return 
     */
    function transferToAave(uint256 transferAmount) public override onlyOwner {
        require(aaveInitialised, "Pool/aave integration is not initialised");
        
        // TODO: investigate why this doesn't work for approvals set to transferAmount rather than a very large number
        linkedToken.approve(aaveProvider.getLendingPoolCore(), uint256(0x1f));        
        aaveLendingPool.deposit(address(linkedToken), transferAmount, referral);
        emit DepositAave(owner(), transferAmount);
    }

    /**
    * @dev Withdraw liquidity from the pool
    * @param amount Number of ERC20 tokens to withdraw 
     */
    function withdraw(uint256 amount) public override {
        require(amount != uint256(0), 'Pool/can not withdraw 0');
        require(totalSupply() > uint256(0), 'Pool/no LP tokens minted');

        uint256 poolERC20Balance = getPoolERC20Balance();
        require(amount <= poolERC20Balance, 'Pool/insufficient pool balance');

        uint256 numLPTokensToBurn = (amount.mul(totalSupply())).div(getPoolERC20Balance());
        
        require(balanceOf(msg.sender) != uint256(0), 'Pool/user has no LP tokens');
        require(numLPTokensToBurn <= balanceOf(msg.sender), 'Pool/not enough LP tokens to burn');
        _burn(msg.sender, numLPTokensToBurn);

        require(
            linkedToken.transfer(msg.sender, amount),
            'Pool/insufficient user funds to withdraw'
        );

        emit Withdraw(msg.sender, address(this), amount);
    }

    /**
    * @dev Redeem aDAI for the underlying asset, resulting in the aTokens being burnt
    * Protected by onlyOwner
     */
    function withdrawFromAave(uint256 redeemAmount) public override onlyOwner {
        require(aaveInitialised, "Pool/aave integration is not initialised");
        aTokenInstance.redeem(redeemAmount);
        emit RedeemAave(owner(), redeemAmount);
    }

    /**
    * @dev Transfer aTokens from this contract to another address
    * Protected by onlyOwner
     */
    function transferATokens(uint256 amount, address recipient) public override onlyOwner {
        require(aaveInitialised, "Pool/aave integration is not initialised");
        require(recipient != address(0x0));
        require(amount != uint256(0));

        aTokenInstance.transfer(recipient, amount);
    }

    /**
    * @dev Get the number of tokens a user has deposited
     */
    function getUserLPBalance(address user) public view override returns (uint256) {
        return balanceOf(user);
    }

    /**
    * @dev Get the total number of aDAI tokens deposited into the liquidity pool
     */
    function getPoolATokenBalance() public view override returns (uint256) {
        require(aaveInitialised, "Pool/aave integration is not initialised");
        return aTokenInstance.balanceOf(address(this));
    }

    /**
    * @dev Get the total number of DAI tokens deposited into the liquidity pool
     */
    function getPoolERC20Balance() public view override returns (uint256) {
        return linkedToken.balanceOf(address(this));
    }

    function lock(uint256 amount) external override onlyOwner {
    }

    function unlock(uint256 amount) external override onlyOwner {
    }

    function sendTokens(address recipient, uint256 transferAmount) external override onlyOwner {
        // TODO: unlock the same tokens
        // unlock(amount)
        require(IERC20(linkedToken).transfer(recipient, transferAmount), "Transfer of pool tokens failed");
    }
}

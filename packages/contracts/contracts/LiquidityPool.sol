pragma solidity >=0.5.0 <0.6.0;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import { ILendingPoolAddressesProvider } from "@studydefi/money-legos/aave/contracts/ILendingPoolAddressesProvider.sol";
import { ILendingPool } from "@studydefi/money-legos/aave/contracts/ILendingPool.sol";
import { ILiquidityPool } from './interfaces/ILiquidityPool.sol';

/**
* @title LiquidityPool
* @author Tom Waite, Tom French
* @dev Base liquidity pool contract, for which users can deposit and withdraw liquidity
* Copyright 2020 Tom Waite, Tom French
 */
contract LiquidityPool is ILiquidityPool, Ownable, ERC20, AaveIntegration {
    using SafeMath for uint256;

    // mainnet addresses
    address public linkedTokenAddress = 0x6b175474e89094c44da98b954eedeac495271d0f;
    address aaveAddressesProviderAddress = 0x24a42fD28C976A61Df5D00D0599C34c4f90748c8;
    address aDaiAddress = 0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d;


    // Aave contracts
    LendingPoolAddressesProvider aaveProvider = LendingPoolAddressesProvider(aaveAddressesProviderAddress);
    LendingPool lendingPool = LendingPool(aaveProvider.getLendingPool());
    AToken aTokenInstance = AToken(aDaiAddress);

    event Deposit(address indexed user, address indexed liquidityPool, uint256 amount);
    event Withdraw(address indexed user, address indexed liquidityPool, uint256 amount);
    event DepositAave(address indexed owner, uint256 transferAmount);
    event RedeemAave(address indexed owner, uint256 redeemAmount);

    constructor() public ERC20('DAIPoolLP', 'DAILP') Ownable() {
        // mint owner 1 LP token
        _mint(owner(), 1);
    }

    /**
    * @dev Add liquidity to the pool. This transfers an `amount` of ERC20 tokens from the user
    * to this smart contract, and simultaneously mints the user a number of LP tokens

    * @param amount Number of ERC20 tokens to transfer to pool
     */
    function deposit(uint256 amount) public {
        require(amount != uint256(0), 'Pool/can not deposit 0');
        require(getPoolERC20Balance() > uint256(0), 'Pool/pool has 0 ERC20 tokens');

        uint256 proportionOfPool = amount.div(getPoolERC20Balance());
        uint256 numLPTokensToMint = proportionOfPool.mul(totalSupply());
        _mint(msg.sender, numLPTokensToMint);

        require(
            IERC20(linkedTokenAddress).transferFrom(msg.sender, address(this), amount),
            'Pool/insufficient user funds to deposit'
        );

        emit Deposit(msg.sender, address(this), amount);
    }

    /**
    * @dev Transfer an amount of this pool's funds to the Aave pool and receive
    * aTokens in return 
     */
    function transferToAave(uint256 transferAmount) public  onlyOwner {
        uint16 referral = 0;
        IERC20(linkedTokenAddress).approve(provider.getLendingPoolCore(), transferAmount);
        
        require(
            lendingPool.deposit(linkedTokenAddress, transferAmount, referral),
            'Pool/not able to deposit to Aave'
        );

        emit DepositAave(owner(), transferAmount);
    }

    /**
    * @dev Withdraw liquidity from the pool
    * @param amount Number of ERC20 tokens to withdraw 
     */
    function withdraw(uint256 amount) public {
        require(amount != uint256(0), 'Pool/can not withdraw 0');
        require(totalSupply() > uint256(0), 'Pool/no LP tokens minted');

        uint256 poolERC20Balance = getPoolERC20Balance();
        require(amount <= poolERC20Balance, 'Pool/insufficient pool balance');

        uint256 proportionOfPool = amount.div(poolERC20Balance);
        uint256 numLPTokensToBurn = proportionOfPool.mul(totalSupply());
        
        require(balanceOf(msg.sender) != uint256(0), 'Pool/user has no LP tokens');
        require(numLPTokensToBurn <= balanceOf(msg.sender), 'Pool/not enough LP tokens to burn');
        _burn(msg.sender, numLPTokensToBurn);

        require(
            IERC20(linkedTokenAddress).transfer(msg.sender, amount),
            'Pool/insufficient user funds to withdraw'
        );

        emit Withdraw(msg.sender, address(this), amount);
    }

    /**
    * @dev Redeem aDAI for the underlying asset, resulting in the aTokens being burnt
    * Protected by onlyOwner
     */
    function redeemWithAave(uint256 redeemAmount) public  onlyOwner {
        aTokenInstance.redeem(redeemAmount);
        // emit RedeemAave(owner(), redeemAmount);
    }

    /**
    * @dev Transfer aTokens from this contract to another address
    * Protected by onlyOwner
     */
    function transferATokens(uint256 amount, address recipient) public  onlyOwner {
        require(receiver != address(0x0));
        require(amount != uint256(0));

        aTokenInstance.transfer(recipient, amount);
    }

    /**
    * @dev Get the number of tokens a user has deposited
     */
    function getUserLPBalance(address user) public view  returns (uint256) {
        return balanceOf(user);
    }

    /**
    * @dev Get the total number of DAI tokens deposited into the liquidity pool
     */
    function getPoolERC20Balance() public view  returns (uint256) {
        return IERC20(linkedTokenAddress).balanceOf(address(this));
    }
}

import React, { ReactElement, useState, useEffect } from 'react';
import { Button, Grid, TextField } from '@material-ui/core';

// import { makeStyles } from '@material-ui/core/styles';

import { Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { useWallet, useAddress } from '../../contexts/OnboardContext';
import LiquidityPool from '../../abis/LiquidityPool.json';
import { Address } from '../../types/types';
// const useStyles = makeStyles((theme) => ({}));

const PoolCardContents = (): ReactElement => {
  // const classes = useStyles();
  const userAddress = useAddress();
  const wallet = useWallet();

  const [poolContract, setPoolContract] = useState<Contract>();
  const [linkedToken, setLinkedToken] = useState<Address>('');
  const [totalLiquidity, setTotalLiquidity] = useState<string>('');
  const [LPTokenSupply, setLPTokenSupply] = useState<string>('');
  const [userLPBalance, setUserLPBalance] = useState<string>('');

  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  useEffect(() => {
    if (wallet.provider) {
      const signer = new Web3Provider(wallet.provider).getSigner();
      const pool = new Contract(process.env.REACT_APP_LIQUIDITY_POOL_ADDRESS as string, LiquidityPool.abi, signer);
      setPoolContract(pool);

      pool.linkedToken().then((tokenAddress: string) => setLinkedToken(tokenAddress));
      pool.getPoolERC20Balance().then((poolBalance: string) => setTotalLiquidity(poolBalance));
      pool.totalSupply().then((LPSupply: string) => setLPTokenSupply(LPSupply));
      pool.getUserLPBalance(userAddress).then((userBalance: string) => setUserLPBalance(userBalance));
    }
  }, [userAddress, wallet]);

  const depositFunds = (amount: string): void => {
    if (poolContract) poolContract.deposit(amount);
  };

  const withdrawFunds = (amount: string): void => {
    if (poolContract) poolContract.withdraw(amount);
  };

  return (
    <Grid container direction="column" alignContent="center" justify="space-around" spacing={3}>
      <Grid item>Pool Address: {process.env.REACT_APP_LIQUIDITY_POOL_ADDRESS}</Grid>
      <Grid item>Linked Token Address: {linkedToken}</Grid>
      <Grid item>Total Pool Liquidity: {totalLiquidity.toString()}</Grid>
      <Grid item>Total Liquidity Token Supply: {LPTokenSupply.toString()}</Grid>
      <Grid item>User Liquidity Token Balance: {userLPBalance.toString()}</Grid>
      <Grid item container justify="space-around" spacing={3}>
        <Grid item>
          <TextField
            label="Enter deposit amount"
            placeholder=""
            variant="outlined"
            value={depositAmount}
            onChange={(val): void => setDepositAmount(val.target.value)}
            fullWidth
          />
          <Button variant="contained" color="primary" onClick={(): void => depositFunds(depositAmount)}>
            Deposit
          </Button>
        </Grid>
        <Grid item>
          <TextField
            label="Enter withdraw amount"
            placeholder=""
            variant="outlined"
            value={withdrawAmount}
            onChange={(val): void => setWithdrawAmount(val.target.value)}
            fullWidth
          />
          <Button variant="contained" color="primary" onClick={(): void => withdrawFunds(withdrawAmount)}>
            Withdraw
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PoolCardContents;

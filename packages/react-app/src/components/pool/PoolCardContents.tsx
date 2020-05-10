import React, { ReactElement, useState, useEffect } from 'react';
// import { makeStyles } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

import { ethers, Contract } from 'ethers';

import { useWallet, useAddress } from '../../contexts/OnboardContext';
import LiquidityPool from '../../abis/LiquidityPool.json';
// const useStyles = makeStyles((theme) => ({}));

const PoolCardContents = (): ReactElement => {
  // const classes = useStyles();
  const userAddress = useAddress();
  const wallet = useWallet();

  const [linkedToken, setLinkedToken] = useState<string>('');
  const [totalLiquidity, setTotalLiquidity] = useState<string>('');
  const [LPTokenSupply, setLPTokenSupply] = useState<string>('');
  const [userLPBalance, setUserLPBalance] = useState<string>('');

  useEffect(() => {
    if (wallet.provider) {
      const signer = new ethers.providers.Web3Provider(wallet.provider).getSigner();
      const poolContract = new Contract(
        process.env.REACT_APP_LIQUIDITY_POOL_ADDRESS as string,
        LiquidityPool.abi,
        signer,
      );

      poolContract.linkedToken().then((tokenAddress: string) => setLinkedToken(tokenAddress));
      poolContract.getPoolERC20Balance().then((poolBalance: string) => setTotalLiquidity(poolBalance));
      poolContract.totalSupply().then((LPSupply: string) => setLPTokenSupply(LPSupply));
      poolContract.getUserLPBalance(userAddress).then((userBalance: string) => setUserLPBalance(userBalance));
    }
  }, [userAddress, wallet]);

  return (
    <Grid container direction="row" justify="space-around" spacing={3}>
      <p>Pool Address: {process.env.REACT_APP_LIQUIDITY_POOL_ADDRESS}</p>
      <p>Linked Token Address: {linkedToken}</p>
      <p>Total Pool Liquidity: {totalLiquidity.toString()}</p>
      <p>Total Liquidity Token Supply: {LPTokenSupply.toString()}</p>
      <p>User Liquidity Token Balance: {userLPBalance.toString()}</p>
    </Grid>
  );
};

export default PoolCardContents;

import React, { ReactElement, useState, useEffect } from 'react';
import { Button, Grid, TextField } from '@material-ui/core';

// import { makeStyles } from '@material-ui/core/styles';

import { Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { useWallet, useAddress } from '../../contexts/OnboardContext';
import LiquidityPool from '../../abis/LiquidityPool.json';
import IERC20 from '../../abis/IERC20.json';

import { Address } from '../../types/types';
import tokens from '../../constants/tokens';

import getOptionContract from '../../utils/getOptionContract';
import DeployPool from './DeployPool';

// const useStyles = makeStyles((theme) => ({}));

const PoolCardContents = ({
  factoryAddress,
  poolToken,
  paymentToken,
}: {
  factoryAddress: Address;
  poolToken: Address;
  paymentToken: Address;
}): ReactElement => {
  // const classes = useStyles();
  const userAddress = useAddress();
  const wallet = useWallet();

  const [poolContract, setPoolContract] = useState<Contract | null>();

  const [totalLiquidity, setTotalLiquidity] = useState<string>('');
  const [LPTokenSupply, setLPTokenSupply] = useState<string>('');
  const [userLPBalance, setUserLPBalance] = useState<string>('');

  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  useEffect(() => {
    async function getPoolContract(): Promise<void> {
      if (factoryAddress && wallet.provider) {
        const signer = new Web3Provider(wallet.provider).getSigner();
        try {
          const optionMarket = await getOptionContract(signer, factoryAddress, poolToken, paymentToken);
          const liquidityPoolAddress = await optionMarket.pool();
          const pool = new Contract(liquidityPoolAddress, LiquidityPool.abi, signer);
          setPoolContract(pool);

          pool.getPoolERC20Balance().then((poolBalance: string) => setTotalLiquidity(poolBalance));
          pool.totalSupply().then((LPSupply: string) => setLPTokenSupply(LPSupply));
          pool.getUserLPBalance(userAddress).then((userBalance: string) => setUserLPBalance(userBalance));
        } catch (e) {
          console.error(e);
          setPoolContract(null);
        }
      }
    }
    getPoolContract();
  }, [wallet, userAddress, factoryAddress, poolToken, paymentToken]);

  const approveFunds = (amount: string): void => {
    const signer = new Web3Provider(wallet.provider).getSigner();
    const token = new Contract(poolToken, IERC20.abi, signer);
    if (poolContract) token.approve(poolContract.address, amount);
  };

  const depositFunds = (amount: string): void => {
    if (poolContract) poolContract.deposit(amount);
  };

  const withdrawFunds = (amount: string): void => {
    if (poolContract) poolContract.withdraw(amount);
  };

  if (!poolContract) {
    return <DeployPool factoryAddress={factoryAddress} poolToken={poolToken} paymentToken={paymentToken} />;
  }

  return (
    <Grid container direction="column" alignContent="center" justify="space-around" spacing={3}>
      <Grid item>Pool Address: {poolContract && poolContract.address}</Grid>
      <Grid item>{`Total Pool Liquidity: ${totalLiquidity.toString()} ${
        tokens[poolToken] ? tokens[poolToken].symbol : ''
      }`}</Grid>
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
          <Button variant="contained" color="primary" onClick={(): void => approveFunds(depositAmount)}>
            Approve
          </Button>
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

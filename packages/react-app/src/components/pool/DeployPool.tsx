import React, { ReactElement } from 'react';
// import { makeStyles } from '@material-ui/core/styles';
import { Button, Grid, Typography } from '@material-ui/core';
import { Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { useWallet } from '../../contexts/OnboardContext';
import OptionsFactory from '../../abis/OptionsFactory.json';

// const useStyles = makeStyles((theme) => ({}));

const DeployPool = (props: any): ReactElement => {
  // const classes = useStyles();
  const wallet = useWallet();

  const deployMarket = (): void => {
    const signer = new Web3Provider(wallet.provider).getSigner();
    const optionsFactory = new Contract(props.factoryAddress as string, OptionsFactory.abi, signer);
    optionsFactory.createMarket(props.poolToken, props.paymentToken);
  };

  return (
    <Grid container direction="column" alignContent="center" alignItems="center" spacing={3}>
      <Grid item>
        <Typography variant="h5">Looks like you&apos;re the first to use this market!</Typography>
      </Grid>
      <Grid item>
        <Typography>Before you can deposit funds, you&apos;ll need to click the button below to deploy it.</Typography>
      </Grid>
      <Grid item>
        <Button variant="contained" color="primary" onClick={deployMarket}>
          Deploy
        </Button>
      </Grid>
    </Grid>
  );
};

export default DeployPool;

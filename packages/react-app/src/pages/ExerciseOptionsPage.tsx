import React, { ReactElement, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import { ethers, Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { useAddress, useWallet } from '../contexts/OnboardContext';

import getOptionContract from '../utils/getOptionContract';

const useStyles = makeStyles((theme) => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(1200 + theme.spacing(2) * 2)]: {
      width: 1200,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    padding: theme.spacing(2),
    [theme.breakpoints.up(800 + theme.spacing(3) * 2)]: {
      padding: theme.spacing(3),
    },
  },
  pageElement: {
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    [theme.breakpoints.up(800 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3),
    },
  },
}));

const ExerciseOptionsPage = (props: any): ReactElement => {
  const classes = useStyles();
  const userAddress = useAddress();
  const wallet = useWallet();

  const [options, setOptions] = useState<Array<any>>([]);
  const [optionContract, setOptionContract] = useState<Contract | null>();

  useEffect(() => {
    async function getPoolContract(): Promise<void> {
      if (props.factoryAddress && wallet.provider) {
        const provider = new Web3Provider(wallet.provider);
        try {
          const optionMarket = await getOptionContract(
            provider,
            props.factoryAddress,
            props.poolToken,
            props.paymentToken,
          );

          const filter = {
            address: optionMarket.address,
            fromBlock: 7957620,
            toBlock: 'latest',
            topics: [ethers.utils.id('Create(uint indexed,address indexed,uint,uint)')],
          };
          console.log('finding logs');
          provider.getLogs(filter).then(console.log);
        } catch (e) {
          console.error(e);
          setOptionContract(null);
        }
      }
    }
    getPoolContract();
  }, [wallet, userAddress, props.factoryAddress, props.poolToken, props.paymentToken]);

  return (
    <Paper className={`${classes.pageElement} ${classes.paper}`}>
      <Grid container direction="row" justify="space-around" spacing={3}>
        {options.length ? 'There are options in the console' : 'No options found'}
      </Grid>
    </Paper>
  );
};

export default ExerciseOptionsPage;

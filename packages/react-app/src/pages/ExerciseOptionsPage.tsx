import React, { ReactElement, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import { ethers, Contract } from 'ethers';
import { Web3Provider, Log } from 'ethers/providers';
import { CircularProgress } from '@material-ui/core';
import OptionsTable from '../components/OptionTable/OptionTable';
import Options from '../abis/Options.json';

import { useAddress, useWalletProvider } from '../contexts/OnboardContext';

import getOptionContract from '../utils/getOptionContract';
import { Option, OptionState } from '../types/types';

const useStyles = makeStyles((theme) => ({
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

const getOptions = async (provider: Web3Provider, optionMarket: Contract, filter: object): Promise<Array<Option>> => {
  const logs = await provider.getLogs(filter);
  const iface = new ethers.utils.Interface(Options.abi);

  return Promise.all(
    logs.map(
      async (log: Log): Promise<Option> => {
        const id = iface.parseLog(log).values.optionId.toString();
        return { id, ...(await optionMarket.options(id)) };
      },
    ),
  );
};

const ExerciseOptionsPage = (props: any): ReactElement => {
  const classes = useStyles();
  const userAddress = useAddress();
  const provider = useWalletProvider();

  const [options, setOptions] = useState<Array<Option>>([]);
  const [optionContract, setOptionContract] = useState<Contract | null>();

  useEffect(() => {
    async function getPoolContract(): Promise<void> {
      if (props.factoryAddress && provider) {
        const etherProvider = new Web3Provider(provider);
        try {
          const optionMarket = await getOptionContract(
            etherProvider,
            props.factoryAddress,
            props.poolToken,
            props.paymentToken,
          );
          setOptionContract(optionMarket);

          const filter = {
            address: optionMarket.address,
            fromBlock: 7957620,
            toBlock: 'latest',
            ...optionMarket.filters.Create(null, userAddress, null, null),
          };
          console.log('finding logs');

          getOptions(etherProvider, optionMarket, filter).then((newoptions) =>
            setOptions(
              newoptions.filter(({ state }: { state: OptionState }) => {
                return state === 0;
              }),
            ),
          );
        } catch (e) {
          console.error(e);
          setOptionContract(null);
        }
      }
    }
    getPoolContract();
  }, [provider, userAddress, props.factoryAddress, props.poolToken, props.paymentToken]);

  if (!optionContract) {
    return (
      <Paper className={`${classes.pageElement} ${classes.paper}`}>
        <Grid container direction="row" justify="space-around" spacing={3}>
          <CircularProgress />
        </Grid>
      </Paper>
    );
  }

  console.log(options);
  return (
    <Paper className={`${classes.pageElement} ${classes.paper}`}>
      <Grid container direction="row" justify="space-around" spacing={3}>
        <OptionsTable paymentToken={props.paymentToken} optionContract={optionContract} options={options} />
      </Grid>
    </Paper>
  );
};

export default ExerciseOptionsPage;

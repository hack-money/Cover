import React, { ReactElement, useEffect, useState } from 'react';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import { ethers, Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import Options from '../abis/Options.json';
import IERC20 from '../abis/IERC20.json';

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

const getOptions = async (provider: Web3Provider, optionMarket: Contract, filter: object) => {
  const logs = await provider.getLogs(filter);
  const iface = new ethers.utils.Interface(Options.abi);

  return Promise.all(
    logs.map(
      async (log: any): Promise<any> => {
        const optionId = iface.parseLog(log).values.optionId.toString();
        return { optionId, ...(await optionMarket.options(optionId)) };
      },
    ),
  );
};

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
            provider.getSigner(),
            props.factoryAddress,
            props.poolToken,
            props.paymentToken,
          );
          setOptionContract(optionMarket);

          const filter = {
            address: optionMarket.address,
            fromBlock: 7957620,
            toBlock: 'latest',
            topics: [ethers.utils.id('Create(uint256,address,uint256,uint256)')],
          };
          console.log('finding logs');

          getOptions(provider, optionMarket, filter).then((newoptions) =>
            setOptions(
              newoptions.filter((option: any) => {
                return option.state === 0;
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
  }, [wallet, userAddress, props.factoryAddress, props.poolToken, props.paymentToken]);

  const approveFunds = (amount: string): void => {
    const signer = new Web3Provider(wallet.provider).getSigner();
    const token = new Contract(props.paymentToken, IERC20.abi, signer);
    if (optionContract) token.approve(optionContract.address, amount);
  };

  const exerciseOption = (optionId: string): void => {
    if (optionContract) optionContract.exercise(optionId);
  };

  return (
    <Paper className={`${classes.pageElement} ${classes.paper}`}>
      <Grid container direction="row" justify="space-around" spacing={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="right">OptionId</TableCell>
              <TableCell align="right">Start time</TableCell>
              <TableCell align="right">Expiry time</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {options.length &&
              options.map((option: any) => {
                return (
                  <TableRow key={option.optionId}>
                    <TableCell align="right">{option.optionId}</TableCell>
                    <TableCell align="right">{moment.unix(option.startTime).format('DD-MM-YYYY HH:mm')}</TableCell>
                    <TableCell align="right">{moment.unix(option.expirationTime).format('DD-MM-YYYY HH:mm')}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={(): void => approveFunds(option.amount.mul(10).toString())}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={(): void => {
                          console.log('optionId: ', option.optionId);
                          return exerciseOption(option.optionId);
                        }}
                      >
                        Exercise Option
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Grid>
    </Paper>
  );
};

export default ExerciseOptionsPage;

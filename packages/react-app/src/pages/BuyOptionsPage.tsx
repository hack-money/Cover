import React, { ReactElement, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Grid, Paper, MenuItem, TextField } from '@material-ui/core';

import { Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';

// import { Address } from '../types/types';
import IERC20 from '../abis/IERC20.json';

import getOptionContract from '../utils/getOptionContract';
import { useWallet } from '../contexts/OnboardContext';
import tokens from '../constants/tokens';

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

enum OptionType {
  Put = 0,
  Call,
}

const BuyOptionsPage = (props: any): ReactElement | null => {
  const classes = useStyles();
  const wallet = useWallet();

  const [optionContract, setOptionContract] = useState<Contract>();
  const [optionType, setOptionType] = useState<OptionType>(OptionType.Put);
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [premium, setPremium] = useState<string>('0');

  useEffect(() => {
    async function getMarketContract(): Promise<void> {
      if (props.factoryAddress && wallet.provider) {
        const signer = new Web3Provider(wallet.provider).getSigner();
        try {
          const optionMarket = await getOptionContract(
            signer,
            props.factoryAddress,
            props.poolToken,
            props.paymentToken,
          );
          setOptionContract(optionMarket);
          // const price = optionMarket.getPoolTokenPrice('1');
          // setCurrentPrice(price);
        } catch (e) {
          console.error(e);
        }
      }
    }
    getMarketContract();
  }, [wallet, props.factoryAddress, props.poolToken, props.paymentToken]);

  const approveFunds = (approvalAmount: string): void => {
    const signer = new Web3Provider(wallet.provider).getSigner();
    const token = new Contract(props.paymentToken, IERC20.abi, signer);
    if (optionContract) token.approve(optionContract.address, approvalAmount);
  };

  const purchaseOption = (): void => {
    if (optionContract) optionContract.createATM(60 * 30, 500000, optionType);
  };

  if (!props.paymentToken || !props.poolToken) return null;
  return (
    <Paper className={`${classes.pageElement} ${classes.paper}`}>
      <Grid container direction="column" alignContent="center" alignItems="center" spacing={3}>
        <Grid item>
          {`I want to be able to `}
          <TextField select value={optionType} onChange={(event: any): void => setOptionType(event.target.value)}>
            <MenuItem key={0} value={OptionType.Call}>
              Buy
            </MenuItem>
            <MenuItem key={1} value={OptionType.Put}>
              Sell
            </MenuItem>
          </TextField>
          <TextField
            // label=""
            placeholder=""
            variant="outlined"
            value={amount}
            onChange={(val): void => setAmount(val.target.value)}
          />
          {`${tokens[optionType === OptionType.Put ? props.paymentToken : props.poolToken].symbol}`}
        </Grid>
        <Grid item>{`A premium of ${premium} ${
          tokens[props.paymentToken].symbol
        } will be needed to buy this option`}</Grid>
      </Grid>
      <Grid item container spacing={3}>
        <Grid item>
          <Button variant="contained" color="primary" onClick={(): void => approveFunds('50000000')}>
            Approve
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={(): void => purchaseOption()}>
            Buy Option
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BuyOptionsPage;

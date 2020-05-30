import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Grid, Paper, MenuItem, TextField } from '@material-ui/core';

import { Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumber } from 'ethers/utils';

// import { Address } from '../types/types';
import IERC20 from '../abis/IERC20.json';

import getOptionContract from '../utils/getOptionContract';
import { useWalletProvider } from '../contexts/OnboardContext';
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

const getFees = async (
  optionContract: Contract,
  amount: string,
  optionType: OptionType,
): Promise<[BigNumber, BigNumber]> => {
  const strikePrice = await optionContract.getPoolTokenPrice(amount);
  return optionContract.calculateFees(60 * 30, amount, strikePrice, optionType);
};

const BuyOptionsPage = (props: any): ReactElement | null => {
  const classes = useStyles();
  const provider = useWalletProvider();

  const [optionContract, setOptionContract] = useState<Contract>();
  const [optionType, setOptionType] = useState<OptionType>(OptionType.Put);
  const [currentPrice, setCurrentPrice] = useState<BigNumber>(bigNumberify(0));
  const [amount, setAmount] = useState<string>('');
  const [premium, setPremium] = useState<BigNumber>(bigNumberify(0));
  const [fee, setFee] = useState<BigNumber>(bigNumberify(0));

  const { poolToken, paymentToken, factoryAddress } = props;
  const poolTokenSymbol = tokens[poolToken].symbol;
  const paymentTokenSymbol = tokens[paymentToken].symbol;

  useEffect(() => {
    async function getMarketContract(): Promise<void> {
      if (factoryAddress && provider) {
        const ethersProvider = new Web3Provider(provider);
        try {
          const optionMarket = await getOptionContract(ethersProvider, factoryAddress, poolToken, paymentToken);
          setOptionContract(optionMarket);
        } catch (e) {
          console.error(e);
        }
      }
    }
    getMarketContract();
  }, [provider, factoryAddress, poolToken, paymentToken]);

  useEffect(() => {
    async function pullFees(inputAmount: string): Promise<void> {
      if (optionContract) {
        const [newPremium, newFee]: [BigNumber, BigNumber] = await getFees(
          optionContract,
          inputAmount || '1',
          optionType,
        );
        setPremium(newPremium);
        setFee(newFee);
      }
    }

    pullFees(amount);
  }, [optionContract, amount, optionType]);

  const getATMPrice = useCallback(
    async (inputAmount: string): Promise<void> => {
      if (!optionContract) return;
      try {
        const price: BigNumber = await optionContract.getPoolTokenPrice(parseInt(inputAmount, 10) || '1');
        console.log(price.toString());
        setCurrentPrice(price);
      } catch (e) {
        console.log(e);
      }
    },
    [optionContract],
  );

  useEffect(() => {
    getATMPrice(amount);
  }, [amount, optionContract, getATMPrice]);

  const approveFunds = (approvalAmount: string): void => {
    const signer = new Web3Provider(provider).getSigner();
    const token = new Contract(paymentToken, IERC20.abi, signer);
    if (optionContract) token.approve(optionContract.address, approvalAmount);
  };

  const purchaseOption = (purchaseAmount: string): void => {
    if (optionContract) optionContract.createATM(2 * 86400, purchaseAmount, optionType);
  };

  if (!paymentToken || !poolToken) return null;
  return (
    <Paper className={`${classes.pageElement} ${classes.paper}`}>
      <Grid container direction="column" alignContent="center" alignItems="center" spacing={3}>
        <Grid container justify="center" alignContent="center" alignItems="center" spacing={1}>
          <Grid item>{`I want to be able to `}</Grid>
          <Grid item>
            <TextField select value={optionType} onChange={(event: any): void => setOptionType(event.target.value)}>
              <MenuItem key={0} value={OptionType.Call}>
                buy
              </MenuItem>
              <MenuItem key={1} value={OptionType.Put}>
                sell
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              // label=""
              placeholder=""
              variant="outlined"
              value={amount}
              onChange={(val): void => setAmount(val.target.value)}
            />
          </Grid>
          <Grid item>{`${optionType === OptionType.Put ? paymentTokenSymbol : poolTokenSymbol} for ${bigNumberify(
            amount,
          ).mul(currentPrice)} ${
            optionType === OptionType.Put ? poolTokenSymbol : paymentTokenSymbol
          } (${currentPrice} ${poolTokenSymbol}/${paymentTokenSymbol})`}</Grid>
        </Grid>
        <Grid item>{`It will cost ${premium
          .add(fee)
          .toString()} ${paymentTokenSymbol} to buy this option. This consists of a premium of ${premium} ${paymentTokenSymbol} paid to liquidity providers and a ${fee} ${paymentTokenSymbol} operator fee`}</Grid>
      </Grid>
      <Grid item container justify="center" spacing={3}>
        <Grid item>
          <Button variant="contained" color="primary" onClick={(): void => approveFunds(amount)}>
            Approve
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={(): void => purchaseOption(amount)}>
            Buy Option
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BuyOptionsPage;

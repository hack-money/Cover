import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';

// import { makeStyles } from '@material-ui/core/styles';

import TokenSelector from './form/TokenSelector';

import { Address } from '../types/types';

// const useStyles = makeStyles((theme) => ({}));

const PoolSelector = ({
  poolToken,
  setPoolToken,
  paymentToken,
  setPaymentToken,
}: {
  poolToken: Address;
  setPoolToken: Function;
  paymentToken: Address;
  setPaymentToken: Function;
}): ReactElement => (
  <Grid container direction="column" alignContent="center" justify="space-around" spacing={3}>
    <Grid item container justify="space-around" spacing={3}>
      <Grid item>
        <TokenSelector
          label="Pool Token"
          helperText="This is the token held within the liquidity pool"
          address={poolToken}
          setAddress={setPoolToken}
        />
      </Grid>
      <Grid item>
        <TokenSelector
          label="Payment Token"
          helperText="This is the token which option holder will pay with"
          address={paymentToken}
          setAddress={setPaymentToken}
        />
      </Grid>
    </Grid>
  </Grid>
);

export default PoolSelector;

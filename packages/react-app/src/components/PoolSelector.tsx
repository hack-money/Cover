import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';

// import { makeStyles } from '@material-ui/core/styles';

import TokenSelector from './form/TokenSelector';

import { Address } from '../types/types';

// const useStyles = makeStyles((theme) => ({}));
const daiAddress = '0xf80a32a835f79d7787e8a8ee5721d0feafd78108';
const usdcAddress = '0x851def71f0e6a903375c1e536bd9ff1684bad802';

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
          address={poolToken || daiAddress}
          setAddress={setPoolToken}
        />
      </Grid>
      <Grid item>
        <TokenSelector
          label="Payment Token"
          helperText="This is the token which option holder will pay with"
          address={paymentToken || usdcAddress}
          setAddress={setPaymentToken}
        />
      </Grid>
    </Grid>
  </Grid>
);

export default PoolSelector;

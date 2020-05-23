import React, { ReactElement } from 'react';
import { TextField, MenuItem } from '@material-ui/core';

import tokens from '../../constants/tokens';
import { Address } from '../../types/types';

const TokenSelector = (props: any): ReactElement => {
  return (
    <TextField
      select
      value={props.address}
      onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
        props.setAddress(event.target.value)
      }
      {...props}
    >
      {Object.entries(tokens).map(
        ([tokenAddress, { symbol }]: [Address, { symbol: string }]): ReactElement => (
          <MenuItem key={tokenAddress} value={tokenAddress}>
            {symbol}
          </MenuItem>
        ),
      )}
    </TextField>
  );
};

export default TokenSelector;

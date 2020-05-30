import React, { ReactElement } from 'react';
import moment from 'moment';
import Button from '@material-ui/core/Button';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { Option } from '../../types/types';

enum OptionState {
  Active = 0,
  Exercised,
  Expired,
}

const OptionRow = ({
  option,
  approveFunds,
  exerciseOption,
}: {
  option: Option;
  approveFunds: Function;
  exerciseOption: Function;
}): ReactElement => {
  const { id, amount, strikeAmount, startTime, expirationTime, state } = option;
  return (
    <TableRow key={id}>
      <TableCell align="right">{id}</TableCell>
      <TableCell align="right">{amount.toString()}</TableCell>
      <TableCell align="right">{strikeAmount.toString()}</TableCell>
      <TableCell align="right">{moment.unix(startTime.toNumber()).format('DD-MM-YYYY HH:mm')}</TableCell>
      <TableCell align="right">{moment.unix(expirationTime.toNumber()).format('DD-MM-YYYY HH:mm')}</TableCell>
      <TableCell align="right">{OptionState[state]}</TableCell>
      <TableCell align="right">
        <Button
          variant="contained"
          color="primary"
          onClick={(): void => approveFunds()}
          disabled={state !== OptionState.Active}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={(): void => {
            console.log('optionId: ', id);
            return exerciseOption();
          }}
          disabled={state !== OptionState.Active}
        >
          Exercise Option
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default OptionRow;

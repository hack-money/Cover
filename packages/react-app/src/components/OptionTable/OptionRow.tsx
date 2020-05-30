import React, { ReactElement } from 'react';
import moment from 'moment';
import Button from '@material-ui/core/Button';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

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
  option: any;
  approveFunds: Function;
  exerciseOption: Function;
}): ReactElement => {
  return (
    <TableRow key={option.optionId}>
      <TableCell align="right">{option.optionId}</TableCell>
      <TableCell align="right">{option.amount.toString()}</TableCell>
      <TableCell align="right">{option.strikeAmount.toString()}</TableCell>
      <TableCell align="right">{moment.unix(option.startTime).format('DD-MM-YYYY HH:mm')}</TableCell>
      <TableCell align="right">{moment.unix(option.expirationTime).format('DD-MM-YYYY HH:mm')}</TableCell>
      <TableCell align="right">{OptionState[option.state]}</TableCell>
      <TableCell align="right">
        <Button
          variant="contained"
          color="primary"
          onClick={(): void => approveFunds()}
          disabled={option.state !== OptionState.Active}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={(): void => {
            console.log('optionId: ', option.optionId);
            return exerciseOption();
          }}
          disabled={option.state !== OptionState.Active}
        >
          Exercise Option
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default OptionRow;

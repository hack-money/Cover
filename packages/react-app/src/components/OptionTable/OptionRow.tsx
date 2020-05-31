import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
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

const useStyles = makeStyles((theme) => ({
  button: {
    padding: theme.spacing(1),
  },
}));

const OptionRow = ({
  option,
  approveFunds,
  exerciseOption,
}: {
  option: Option;
  approveFunds: Function;
  exerciseOption: Function;
}): ReactElement => {
  const classes = useStyles();
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
        <div className={classes.button}>
          <Button
            variant="contained"
            color="primary"
            onClick={(): void => approveFunds()}
            disabled={state !== OptionState.Active}
          >
            Approve
          </Button>
        </div>
        <div className={classes.button}>
          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={(): void => {
              console.log('optionId: ', id);
              return exerciseOption();
            }}
            disabled={state !== OptionState.Active}
          >
            Exercise Option
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default OptionRow;

import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import PoolCardContents from '../components/pool/PoolCardContents';

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

const AddLiquidityPage = (props: any): ReactElement => {
  const classes = useStyles();

  return (
    <>
      <Paper className={`${classes.pageElement} ${classes.paper}`}>
        <PoolCardContents
          factoryAddress={props.factoryAddress}
          poolToken={props.poolToken}
          paymentToken={props.paymentToken}
        />
      </Paper>
    </>
  );
};

export default AddLiquidityPage;

import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import PoolCardContents from '../components/pool/PoolCardContents';

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

const AddLiquidityPage = (): ReactElement => {
  const classes = useStyles();

  return (
    <>
      <Paper className={`${classes.pageElement} ${classes.paper}`}>
        <Grid container direction="row" justify="space-around" spacing={3}>
          Placeholder screen to add liquidity
        </Grid>
      </Paper>
      <Paper className={`${classes.pageElement} ${classes.paper}`}>
        <PoolCardContents />
      </Paper>
    </>
  );
};

export default AddLiquidityPage;

import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import { useAddress, useWallet } from './contexts/OnboardContext';

import Header from './components/header/Header';

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
  icon: {
    marginRight: theme.spacing(2),
  },
  // button: {
  //   marginRight: theme.spacing(2),
  // },
  title: {
    flexGrow: 1,
  },
}));

// const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID as string, 10);

const App = (): ReactElement => {
  const classes = useStyles();
  // const userAddress = useAddress();
  // const wallet = useWallet();

  return (
    <>
      <Header />
      <main className={classes.layout}>
        <Paper className={`${classes.pageElement} ${classes.paper}`}>
          <Grid container direction="row" justify="space-around" spacing={3}>
            Placeholder
          </Grid>
        </Paper>
      </main>
    </>
  );
};

export default App;

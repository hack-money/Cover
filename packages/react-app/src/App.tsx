import React, { ReactElement, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import SideBar from './components/SideBar';
import PoolSelector from './components/PoolSelector';

import AddLiquidityPage from './pages/AddLiquidityPage';
import BuyOptionsPage from './pages/BuyOptionsPage';
import ExerciseOptionsPage from './pages/ExerciseOptionsPage';

import { Address } from './types/types';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
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

const App = (): ReactElement => {
  const classes = useStyles();
  const [open, setOpen] = useState(true);
  const [poolToken, setPoolToken] = useState<Address>('');
  const [paymentToken, setPaymentToken] = useState<Address>('');

  const factoryAddress = process.env.REACT_APP_OPTIONS_FACTORY_ADDRESS;

  return (
    <div className={classes.root}>
      <Router>
        <SideBar open={open} setOpen={setOpen} />
        <main className={`${classes.content} ${open ? classes.contentShift : ''}`}>
          <Paper className={`${classes.pageElement} ${classes.paper}`}>
            <PoolSelector
              poolToken={poolToken}
              setPoolToken={setPoolToken}
              paymentToken={paymentToken}
              setPaymentToken={setPaymentToken}
            />
          </Paper>
          <Switch>
            <Redirect exact path="/" to="/deposit" />
            <Route exact path="/deposit">
              <AddLiquidityPage factoryAddress={factoryAddress} poolToken={poolToken} paymentToken={paymentToken} />
            </Route>
            <Route exact path="/options/buy">
              <BuyOptionsPage factoryAddress={factoryAddress} poolToken={poolToken} paymentToken={paymentToken} />
            </Route>
            <Route exact path="/options/exercise" component={ExerciseOptionsPage} />
          </Switch>
        </main>
      </Router>
    </div>
  );
};

export default App;

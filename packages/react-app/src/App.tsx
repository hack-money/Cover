import React, { ReactElement, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { Paper } from '@material-ui/core';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import SideBar from './components/sidebar';
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

const daiAddress = '0xf80a32a835f79d7787e8a8ee5721d0feafd78108';
const busdAddress = '0xfa6adcff6a90c11f31bc9bb59ec0a6efb38381c6';

const App = (): ReactElement => {
  const classes = useStyles();
  const [open, setOpen] = useState(true);
  const [poolToken, setPoolToken] = useState<Address>(daiAddress);
  const [paymentToken, setPaymentToken] = useState<Address>(busdAddress);

  const factoryAddress = process.env.REACT_APP_OPTIONS_FACTORY_ADDRESS;

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Router>
        <SideBar open={open} setOpen={setOpen} />
        <main className={`${classes.content} ${open ? classes.contentShift : ''} `}>
          <div className={`${classes.layout}`}>
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
              <Route exact path="/options/exercise">
                <ExerciseOptionsPage
                  factoryAddress={factoryAddress}
                  poolToken={poolToken}
                  paymentToken={paymentToken}
                />
              </Route>
            </Switch>
          </div>
        </main>
      </Router>
    </div>
  );
};

export default App;

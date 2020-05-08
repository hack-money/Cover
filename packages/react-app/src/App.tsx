import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import SideBar from './components/SideBar';

import addLiquidityPage from './pages/AddLiquidityPage';
import BuyOptionsPage from './pages/BuyOptionsPage';
import ExerciseOptionsPage from './pages/ExerciseOptionsPage';

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
}));

const App = (): ReactElement => {
  const classes = useStyles();

  return (
    <Router>
      <SideBar />
      <main className={classes.layout}>
        <Switch>
          <Redirect exact path="/" to="/deposit" />
          <Route exact path="/deposit" component={addLiquidityPage} />
          <Route exact path="/options/buy" component={BuyOptionsPage} />
          <Route exact path="/options/exercise" component={ExerciseOptionsPage} />
        </Switch>
      </main>
    </Router>
  );
};

export default App;

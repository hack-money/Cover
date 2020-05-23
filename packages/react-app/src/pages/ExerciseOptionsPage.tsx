import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useQuery } from '@apollo/client';
import { useAddress } from '../contexts/OnboardContext';

import GET_OPTIONS from '../graphql/options';

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

const ExerciseOptionsPage = (): ReactElement => {
  const classes = useStyles();
  const userAddress = useAddress();
  const { loading, error, data } = useQuery(GET_OPTIONS, {
    variables: { address: userAddress || '' },
    fetchPolicy: 'network-only',
  });

  console.log(data);
  if (loading || error) {
    return (
      <Paper className={`${classes.pageElement} ${classes.paper}`}>
        <Grid container direction="row" justify="space-around" spacing={3}>
          <CircularProgress />
        </Grid>
      </Paper>
    );
  }

  const { options } = data;
  console.log(options);
  return (
    <Paper className={`${classes.pageElement} ${classes.paper}`}>
      <Grid container direction="row" justify="space-around" spacing={3}>
        {options.length ? 'There are options in the console' : 'No options found'}
      </Grid>
    </Paper>
  );
};

export default ExerciseOptionsPage;

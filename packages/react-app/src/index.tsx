import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { ThemeProvider } from '@material-ui/core/styles';

import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import App from './App';
import * as serviceWorker from './serviceWorker';
import OnboardProvider from './contexts/OnboardContext';
import theme from './theme';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: process.env.REACT_APP_SUBGRAPH_URL,
  }),
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <OnboardProvider>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </OnboardProvider>
  </ThemeProvider>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

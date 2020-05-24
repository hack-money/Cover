const { usePlugin } = require('@nomiclabs/buidler/config');

usePlugin('@nomiclabs/buidler-etherscan');
require('dotenv').config({ path: '.env.development' });

usePlugin('@nomiclabs/buidler-waffle');


module.exports = {
    solc: {
        version: '0.6.6',
        optimizer: {
            enabled: true,
            runs: 10000,
        },
    },
    mocha: {
        bail: true,
        enableTimeouts: false,
        reporter: 'spec',
    },
    networks: {
        ropsten: {
            url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
            chainId: 3,
            from: process.env.TESTING_ACCOUNT,
            accounts: [process.env.TESTING_ACCOUNT],
            gas: 8000000,
            gasPrice: 10000000000,
        },
    },
    etherscan: {
        url: 'https://api-ropsten.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

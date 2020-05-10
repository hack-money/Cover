const { bigNumberify } = require('ethers/utils');

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

async function mineBlock(provider, timestamp) {
  await new Promise((resolve, reject) =>
    provider._web3Provider.sendAsync( // eslint-disable-line no-underscore-dangle
      { jsonrpc: '2.0', method: 'evm_mine', params: [timestamp] },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
  )
}

module.exports = {
  expandTo18Decimals,
  mineBlock
}
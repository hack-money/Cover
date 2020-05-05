const { bigNumberify } = require('ethers/utils');

function encodePrice(reserve0, reserve1) {
  return [reserve1.mul(bigNumberify(2).pow(112)).div(reserve0), reserve0.mul(bigNumberify(2).pow(112)).div(reserve1)]
}

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
  encodePrice,
  expandTo18Decimals,
  mineBlock
}
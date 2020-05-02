const dotenv = require('dotenv');
const { ethers } = require('ethers');
const Ganache = require('ganache-core');

dotenv.config();

const { ROPSTEN_NODE_URL, PRIVATE_KEY } = process.env;

const startChain = async () => {
  const ganache = Ganache.provider({
    fork: ROPSTEN_NODE_URL,
    network_id: 3,
    accounts: [
      {
        secretKey: PRIVATE_KEY,
        balance: ethers.utils.hexlify(ethers.utils.parseEther('1000')),
      },
    ],
  });

  const provider = new ethers.providers.Web3Provider(ganache);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  return wallet;
};

module.exports = { startChain };

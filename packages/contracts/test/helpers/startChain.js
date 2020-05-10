const dotenv = require('dotenv');
const { ethers } = require('@nomiclabs/buidler');
const Ganache = require('ganache-core');

dotenv.config();

const { ROPSTEN_NODE_URL, PRIVATE_KEY } = process.env;

const startChain = async (userPrivateKey = PRIVATE_KEY) => {
    const ganache = Ganache.provider({
        fork: ROPSTEN_NODE_URL,
        network_id: 3,
        accounts: [
            {
                secretKey: userPrivateKey,
                balance: ethers.utils.hexlify(ethers.utils.parseEther('1000')),
            },
        ],
    });

    const provider = new ethers.providers.Web3Provider(ganache);
    const wallet = new ethers.Wallet(userPrivateKey, provider);

    return wallet;
};

module.exports = { startChain };

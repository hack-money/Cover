/* eslint-disable no-console */
const { ethers } = require('@nomiclabs/buidler');

// Ropsten addresses
const UNISWAP_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const DAI = '0xf80a32a835f79d7787e8a8ee5721d0feafd78108';
const USDC = '0x851def71f0e6a903375c1e536bd9ff1684bad802';

async function main() {
    const LiquidityPoolFactory = await ethers.getContractFactory(
        'LiquidityPoolFactory'
    );
    const liquidityPoolFactory = await LiquidityPoolFactory.deploy();
    await liquidityPoolFactory.deployed();
    console.log('Liqudity pool factory deployed to: ', liquidityPoolFactory.address);

    const OracleFactory = await ethers.getContractFactory('OracleFactory');
    const oracleFactory = await OracleFactory.deploy();
    await oracleFactory.deployed();
    console.log('Oracle factory deployed to: ', oracleFactory.address);

    const OptionsFactory = await ethers.getContractFactory('OptionsFactory');
    console.log({ OptionsFactory });
    const optionsFactory = await OptionsFactory.deploy(
        UNISWAP_FACTORY,
        liquidityPoolFactory.address,
        oracleFactory.address
    );
    const optionsFactoryReceipt = await optionsFactory.deployed();
    console.log({ optionsFactoryReceipt });
    console.log('Options factory deployed to: ', optionsFactory.address);

    const result = await optionsFactory.createMarket(DAI, USDC);
    console.log('options market created: ', result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

import { Contract } from 'ethers';

import OptionsFactory from '../abis/OptionsFactory.json';
import Options from '../abis/Options.json';

import { Address } from '../types/types';

const getOptionContract = async (
  provider: any,
  factoryAddress: Address,
  poolToken: Address,
  paymentToken: Address,
): Promise<Contract> => {
  const optionsFactory = new Contract(factoryAddress, OptionsFactory.abi, provider);
  const optionMarketAddress = await optionsFactory.getMarket(poolToken, paymentToken);
  const optionMarket = new Contract(optionMarketAddress as string, Options.abi, provider);
  return optionMarket;
};

export default getOptionContract;

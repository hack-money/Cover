import { BigNumber } from 'ethers/utils';

export type Address = string;

export type Hash = string;

// declare global {
//   interface Window {
//     aztec: any;
//     ethereum: any;
//     web3: any;
//   }
// }

export type OptionType = 0 | 1;
export type OptionState = 0 | 1 | 2;

export type Option = {
  id: string;
  amount: BigNumber;
  expirationTime: BigNumber;
  holder: Address;
  optionType: OptionType;
  premium: BigNumber;
  startTime: BigNumber;
  state: OptionState;
  strikeAmount: BigNumber;
};

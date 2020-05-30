import React, { ReactElement } from 'react';
import { Contract } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import OptionRow from './OptionRow';

import IERC20 from '../../abis/IERC20.json';
import { useWalletProvider } from '../../contexts/OnboardContext';
import { Address, Option } from '../../types/types';

const OptionTable = ({
  paymentToken,
  optionContract,
  options,
}: {
  paymentToken: Address;
  optionContract: Contract;
  options: Array<Option>;
}): ReactElement => {
  const provider = useWalletProvider();

  const approveFunds = (amount: string): void => {
    const signer = new Web3Provider(provider).getSigner();
    const token = new Contract(paymentToken, IERC20.abi, signer);
    if (optionContract) token.approve(optionContract.address, amount);
  };

  const exerciseOption = (optionId: string): void => {
    optionContract.exercise(optionId);
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell align="right">Option ID</TableCell>
          <TableCell align="right">Amount</TableCell>
          <TableCell align="right">Strike Amount</TableCell>
          <TableCell align="right">Start Time</TableCell>
          <TableCell align="right">Expiry Time</TableCell>
          <TableCell align="right">Option State</TableCell>
          <TableCell align="right"></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {options.map((option: Option) => (
          <OptionRow
            key={option.id}
            option={option}
            approveFunds={(): void => approveFunds(option.amount.mul(10).toString())}
            exerciseOption={(): void => exerciseOption(option.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default OptionTable;

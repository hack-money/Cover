import { gql } from '@apollo/client';

const GET_OPTIONS = gql`
  query getOptions($address: String!) {
    options(where: { holder: $address }) {
      id
      holder
      fee
      premium
    }
  }
`;

export default GET_OPTIONS;

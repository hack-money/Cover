pragma solidity >=0.6.0 <0.7.0;

/**
 * @title Option Types
 * @author Tom French, Tom Waite
 */
enum State { Active, Exercised, Expired }
enum OptionType { Put, Call }

struct Option {
  State state;
  OptionType optionType;
  address holder;
  uint strikeAmount;
  uint amount;
  uint startTime;
  uint expirationTime;

}
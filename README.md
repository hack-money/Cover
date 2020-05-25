__Warning: This is a hackathon project, use at own risk. It is likely very possible to lose funds__

# Cover
A protective DAI options market, motivated by the recent Black Thursday events. It allows users, likely CDP holders, to ahead of time to purchase the right to buy DAI, for a particular price in another stablecoin. 

This means that if the price of DAI rises away from the peg during a Black Thursday'esque liquidity crunch, CDP owners are able to purchase DAI at a lower than inflated price and deleverage more cheaply. 

We start with DAI:BUSD options.

## How it works
At the core is a liquidity pool which holds the Pool token - in this case DAI. A user looking to sell a DAI option can supply liquidity (DAI) to this pool and in return they are minted LP tokens. These tokens entitle them to a share of the value the pool generates (principally from premiums paid by option buyers). 

A CDP owner looking to buy some `Cover`, can then go to the options market contract and call `create()` - specifying the amount they want, the duration etc. They pay BUSD as premium for the right to do so, which is then exchanged to DAI using Uniswap and deposited into the pool. 

The protocol is extensible - there are a system of factory contracts in place that deploy the `Options` contracts, the Uniswap oracle and the liqudity pool. This allows anyone to call `OptionsFactory.createMarket(token0, token1)` and deploy the option market they require.

## Inspiration
On-chain options are an exciting, evolving space with lots of innovation. We drew inspiration from various teams including Primitive Finance, Hegic and Opyn. 



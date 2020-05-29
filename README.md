<p align="center"><img src="https://github.com/hack-money/Cover/blob/dev/logo.png" width="280px"/></p>

__Warning: This is a hackathon project, use at own risk. It is likely very possible to lose funds__

## Deployed at: https://coveroptions.eth.link 

# Cover
A protective DAI options market, motivated by the recent Black Thursday events. It allows users, likely CDP holders, to ahead of time to purchase the right to buy DAI, for a particular price in another stablecoin. 

This means that if the price of DAI rises away from the peg during a Black Thursday'esque liquidity crunch, CDP owners are able to purchase DAI at a lower than inflated price and deleverage more cheaply. 

We start with and have deployed a Ropsten DAI:BUSD options market.

## Extensibility
In addition, the protocol has been generalised such that it is possible to deploy any options market between two assets; for which a pair exists on Uniswap. This can be done by any user through the UI, allowing this to be extended beyond protective DAI options. 

A system of factory contracts are used for this purpose.

## How it works
### Option seller
At the core is a liquidity pool which holds the Pool token - in the case of a DAI:BUSDC market this would be DAI. A user looking to sell a DAI option can supply liquidity (DAI) to this pool and in return they are minted LP tokens. These tokens entitle them to a share of the value the pool generates (principally from premiums paid by option buyers). 

When an option writer looks to 'cash in' their earnings, they can redeem their LP tokens and have them burnt. They are transferred the value of these tokens, which are now worth more due to premiums paid in by buyers.

### Option buyer
A CDP owner looking to buy some `Cover`, can then go to the options market contract and call `create()` - specifying the amount of `Cover` they want, the duration etc. In a DAI:BUSDC market, they use BUSD as premium for the right to do so, which is then exchanged to DAI using Uniswap and deposited into the pool. 

### Option pricing
Option premiums are currently calculated using a Black-Scholes approximation that assumes short time periods, constant asset volatility and the option being close to the money

## Integrations with DeFi building blocks
- Uniswap: the UniswapV2 exchange is used to swap pool and payment tokens, whilst the V2 price oracles are used for on-chain pricing data
- Aave: a portion of the liquidity pool is deposited to Aaave to earn additional passive yield for option sellers
- Graph protocol: built a subgraph to index on-chain option activity and present to the front-end
- ENS + IPFS: used to deploy and host the web app

## Areas for improvement
- Complete the `Buy Options` page of the UI: does not currently expose the various option variables (strike price, expiration date etc) and allow a user to adjust to their needs (ran out of time to add this to the UI)
- Thoroughly benchmark premium pricing results
- More accurately determine the volatility of the underlying asset + potentially find an on-chain dynamic source

## Acknowledgements and references
On-chain options are an exciting, evolving space with lots of innovation. In building the hack, we drew inspiration from several teams including Primitive Finance, Hegic, Opyn and for individual option markets we use a liquidity pool model similar to Hegic.



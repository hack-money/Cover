# High level project aims

The project aims to build a DAI protective options market, to help DAI maintain it’s peg during events when many vault owners need to rapidly deleverage. 

This benefits both DAI and Vault owners. DAI holders earn a premium from selling these options, most of the time which aren’t exercised, and Vault owners are in effect buying insurance for their DAI price. 


# Review of existing platforms

## Opyn

Allows for the creation of generalised options. 

The buyer of the put option contract gains the right, but not the obligation, to sell an asset at a particular strike price, up until an particular expiry date. They pay a premium for this right. 

The seller takes on the obligation to buy the asset at a particular strike price. 

### User Flow
- DAI holder
  1. The DAI holder is in effect the ‘seller’ of the options contract, the so called writer
  2. They lock up the DAI as collateral in an Opyn vault, and receive minted oTokens in return
  3. The oTokens represent their premium - they can then go sell these tokens on a DEX suh as UniSwap and realise their profit that way

- CDP owner
  1. CDP owner wants to protect against the DAI price rising
  2. They buy oTokens off an exchange (buy the option). These oTokens belong to a specific series of options - with a predetermined strike price, expiry date etc.
  3. They can then exercise these options at some point in time. This gives the CDP owner the right to buy collateral from the vaults, at a particular price called the strike price. This was set when the vaults were first opened by collateral providers. The strike price is strictly less than the amount the oTokens are worth (this is the premium they pay).

This does support moving funds to a lending provider liquidity pool, as all funds are transferred to an options series contract -> these can then be forwarded on.

### Options exercise flow

Consider the case of two DAI holders Alice and Bob each with their own vault. They both place in 100 DAI. By placing this DAI in the vault they may mint a number of options tokens (oTokens)

#### Situation 1

1. Alice mints 50 oTokens and sells them to Charlie. Bob mints 25 oTokens and holds onto them.

2. The DAI price rises and Charlie wants to exercise the option. He pays in the 50 oTokens along with an appropriate amount of USDC. At the same time he gives an array of vaults he wants to claim from.

He now has two possible choices of what this array is. Either he exercises his options against just Alice or against both Bob and Alice.

1. Vaults = [Alice]
   - Alice has minted 50 oTokens so this vault satisfies Charlie’s order. Charlie claims some of Alice’s DAI and leaves behind USDC in her vault.
2. Vaults = [Bob, Alice]:
   - Charlie first tries Bob’s vault. Bob has minted 25 oTokens so this vault doesn’t satisfy all of Charlie’s order, however Charlie can exercise 25 of his oTokens against Bob’s vault.
   - Charlie then goes to Alice’s vault. Alice’s vault has minted 50 oTokens which is more than the 25 Charlie still has. Charlie then claims the same amount of DAI from Alice as he did from Bob and leaves behind USDC in her vault.

This might seem odd that Bob can be “liquidated” from tokens which were minted by Alice. But this is fine as by minting an oToken Bob has made a promise to sell up to 25 of his DAI at the given price. He could sell these tokens to gain the same economic benefit which Alice received from Charlie when she sold them to him. (in fact at this point the options are worth more as they are worth exactly the same as the premium paid for the DAI in the vault whereas Alice had to discount them due to the chance of expiry.)


#### Situation 2

1. Alice mints 50 oTokens and sells them to Charlie. Bob doesn’t mint any oTokens

2. The DAI price rises and Charlie wants to exercise the option. He pays in the 50 oTokens along with an appropriate amount of USDC.

3. At this point Bob hasn’t made a promise to buy this USDC through minting oTokens so Charlie can’t exercise the option against Bob’s vault. Charlie must set the array of vaults to be [Alice] and claim the full 50 oTokens against her vault.

### Pros/Cons

#### Pros:
1. 

#### Cons:
1. Only oTokens of the same series are fungible with each other -> Fragmentation of collateral
2. Questions have been raised about how flashloans affect the current system

## Hegic

### User Flow:

#### DAI holder (option seller)
1. Provides DAI to the DAI liquidity pool, and receives writeDAI tokens in return. They have written the option and the tokens are their premium
2. The writeDAI token acts as a ‘receipt’ for their deposit - it entitles them to a share of the premiums and losses made by the liquidity pool, according to their contributed liquidity pool proportion

#### CDP owner (option buyer)
1. They pay a premium and transfer the relevant premium to the Hegic contract
2. In return, they are later able to withdraw the paid for amount of DAI from the liquidity pool in exchange for their strike asset

The premiums or losses activated by other liquidity providers, before the latest provider joined the pool, are not applicable to the latest liquidity providers.

### Pros/Cons

#### Pros:
1. Each "series" of options share the same liquidity pool.
2. Liquidity providers don't need to transfer between pools. Set and forget.

#### Cons:
1. No resale market for options.
2. Contracts can't be trusted to build upon.


# Our design

It seems that the liquidity pool design could end up being simpler and more elegant than Opyn's. Everyone pays into a liquidity pool and receives a LP token in return while Maker vault holders can buy options directly from the pool. This has the benefit of not requiring users to hop their vaults between contracts periodically.

The issue I ran into when thinking about this model was how to handle the USDC from options being exercised? Hegic currently immediately floats the payment tokens on the open market for the collateral asset.
In our case we'd rather hold onto the USDC for a little while before returning it into DAI to lock in the profit.

> Note: In high spread situations Hegic currently holds the payment token out of the pool until spreads reduce. However this raises issues of improper accounting in high spread scenarios (exactly the scenarios we're expecting most usage) as when burning/minting LP tokens these assets are not taken into account.

We can’t just make the LP tokens worth a fraction of DAI and USDC as it gets complex thinking about when people want to sell their USDC and enter more DAI into the pool. Tracking who is entitled to what ratio of DAI to USDC gets hard. Should new liquidity providers pay in a fraction of USDC?

(Note: this issue doesn't really apply to other markets as we don't have any expectation that the exchange rate will return to any particular value for ETH:DAI for example.)

It's possible that some thinking along the lines in this EIP could help with this issue: https://github.com/Roger-Wu/erc1726-dividend-paying-token/blob/master/contracts/DividendPayingToken.sol

We could then use this logic (with some modifications) to distribute the USDC according to people’s LP token balance. LP tokens holders can then withdraw their dividends or funnel it back into the pool for extra LP tokens.

We'd need to consider what the expected yield is for a given share of the liquidity pool as it's possible that a lot of people would only receive dust. It would be interesting to see if we could automatically rebalance these USDC proceeds back into DAI when the price gets back to normal.

This would correspond to a negative dividend being paid out through EIP1726 so it's important to check whether this would result in any unexpected outcomes. Otherwise we have issues if someone withdraws their whole USDC balance and then the USDC is rebalanced into DAI? They’ve just got free DAI.

## Pros/Cons

### Pros:
1. Very easy to explain the project and who benefits from it and how
   
2. Liquidity pool model makes it very intuitive for Aave/Compound users to use. It’s just like Aave but with extra yield.

3.  Very easy to generalise to other markets. We could extend to any other pairing of assets so there’s scope for an FX options market with different currencies.

4.  With Hegic imploding on twitter. There’s an opportunity to just completely replace them for ETH:DAI calls/puts as well as tackling DAI peg.

5.  Flash loan resistant.

### Cons:
1. Need to start from scratch to avoid issues related to Hegic rather than building on existing platform. (plus avoiding any remaining bugs)
   
2. Options are currently untradable so no resale value. (Could possibly be rectified)

## Bounties

A couple of ideas about how we could target certain bounties

Core:
- Aave: Chuck a load of the DAI into Aave for y i e l d h a c k i n g
- Uniswap v2: Integration as a price sensor and swapping USDC into DAI
- Balancer: Integration as a price sensor

Easy: 
- ENS: Chuck the frontend on IPFS and point an ENS name at it.

Tenuous:
- ~~Portis: If we go down the route of protecting against FX risk we could integrate the fiat onramp of Portis to be a “Go directly from EUR to DeFi without USD exposure”~~ Fiat onramp is down for duration of hackathon
- ~~GSN: Bonus points on top of Portis. “Go directly from EUR to DeFi without USD exposure without ETH”~~
- pTokens: Bet on the ETH:BTC ratio anyone?

## (Tentative) Plan

Considering the recent serious oversight and likelihood of further bugs in the contracts, I don’t trust the implementation an iota but the design seems to be decent.

I'm planning to do a ground up rewrite of the contracts with best practices. We would also need to think through the economics of the system in some detail as I don’t trust the Hegic people to have done this properly.

Relative to building on top of Opyn, there’s a little upfront work but the system is so much simpler I think it’s worth it.

At this point we can create an options platform which works off of a liquidity pool model for ERC20-ERC20 pairs quite easily. We’ll want/need to swap out Uniswap v1 for Uniswap v2 at this point. We could in theory stop here and make a frontend for an FX options market for different currency stablecoins and say job done if we wanted to and have a complete project.

The next step is to automatically convert a fraction of the pool to aTokens automatically for yield hacking reasons. This shouldn’t take long at all. This is required to make the DAI:USDC pool worth it for liquidity providers.

Finally we can rework the options to be ERC1155 tokens based on strike price and expiry.

In bullet points:
1. Completely rebuild the contracts, add a test suite.
2. Finish modifications to all options to work with ERC20-ERC20 pairs
3. Think about game theory
4. Update oracles to point at uniswap v2, etc.
5. Yield hacking with Aave
6. Implement one-click "exercise option to pay back debt" functionality
7. Add resale market for options tokens

## Final product

In the end we should have a solid platform for a decentralised options market. We can then target this in a number of directions:

1. USDC:DAI options to guarantee DAI liquidity in a black swan
   - can push this with “If only we had this on Black Thursday” meme.
2. FX options market for different flavour stablecoins
3. Direct replacement for Hegic/Opyn with ETH:DAI options.
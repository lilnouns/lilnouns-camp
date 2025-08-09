# oETH and mETH Support

## Overview

The project includes treasury support for liquid staking derivatives (LSDs) such as **oETH** (Origin Ether) and **mETH** (Mantle Staked Ether). These assets are treated similarly to native ETH holdings but require on-chain balance queries and off-chain price and APR data to compute treasury totals and yield projections.

## Implementation

### API Route

- File: `apps/nouns-camp/src/app/api/treasury/route.js`
- Uses `viem`'s `createPublicClient` to read token balances from the executor address.
- Fetches conversion rates via external APIs (Coingecko for prices) and APR data from protocol-specific endpoints.
- Caches responses for one hour to reduce repeated network calls.
- Returns balances, conversion rates, and APRs for ETH and supported LSDs.

### React Hook

- File: `apps/nouns-camp/src/hooks/treasury-data.js`
- Wraps the API route with `react-query` for client-side caching and parsing.
- Converts token balances to `BigInt` and computes totals in both ETH and USD.
- Provides helper functions like `getTotalEth` for aggregating balances across ETH, wETH, rETH, oETH, mETH, stETH, and wstETH.

### UI Components

- **Treasury Dialog** (`apps/nouns-camp/src/components/treasury-dialog.jsx`)
  - Displays individual token balances with conversions to ETH.
  - Projects staking yields using APR data for rETH, oETH, mETH, and stETH/wstETH.
- **Proposal Screen** (`apps/nouns-camp/src/components/proposal-screen.jsx`)
  - Includes staking yield from oETH and mETH when estimating annual income.

## Dependencies and Design Patterns

- **Dependencies**: `viem` for on-chain reads, `@tanstack/react-query` for data fetching, external REST APIs for price and APR data.
- **Design Patterns**: modular separation between data fetching (API route), state management (React hooks), and presentation (React components). All monetary values use `BigInt` to avoid floating point errors.

## mETH Integration

The mETH implementation mirrors the existing oETH logic:

- Added `meth-token` contract resolution.
- Fetches mETH/ETH price and APR in the API route.
- Includes mETH balances in treasury totals and yield projections.
- UI components display mETH balances and estimated yield alongside other assets.

import { describe, expect, it } from "vitest";

import { getTotalEth } from "./treasury-data";

describe("getTotalEth", () => {
  it("includes nouns bidder eth balance", () => {
    const balances = {
      executor: {
        eth: 1n,
        weth: 0n,
        reth: 0n,
        oeth: 0n,
        steth: 0n,
        wsteth: 0n,
        usdc: 0n,
      },
      "dao-proxy": { eth: 3n },
      "token-buyer": { eth: 4n },
      "nouns-bidder": { eth: 5n },
    };

    const rates = {
      rethEth: 10n ** 18n,
      oethEth: 10n ** 18n,
      usdcEth: 10n ** 6n,
    };

    const result = getTotalEth({ balances, rates });

    expect(result).toBe(13n);
  });

  it("handles missing nouns bidder balance", () => {
    const balances = {
      executor: {
        eth: 1n,
        weth: 0n,
        reth: 0n,
        oeth: 0n,
        steth: 0n,
        wsteth: 0n,
        usdc: 0n,
      },
      "dao-proxy": { eth: 3n },
      "token-buyer": { eth: 4n },
    };

    const rates = {
      rethEth: 10n ** 18n,
      oethEth: 10n ** 18n,
      usdcEth: 10n ** 6n,
    };

    const result = getTotalEth({ balances, rates });

    expect(result).toBe(8n);
  });
});

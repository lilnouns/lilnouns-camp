import { describe, it, expect } from "vitest";
import { getTotalEth } from "./treasury-data.js";

describe("getTotalEth", () => {
  it("includes oETH and mETH conversions", () => {
    const data = {
      balances: {
        executor: {
          eth: 1n,
          weth: 2n,
          reth: 3n,
          oeth: 4n,
          meth: 5n,
          steth: 0n,
          wsteth: 0n,
        },
        "dao-proxy": { eth: 6n },
        "token-buyer": { eth: 7n },
      },
      rates: {
        rethEth: 2n * 10n ** 18n,
        oethEth: 3n * 10n ** 18n,
        methEth: 4n * 10n ** 18n,
      },
    };

    const total = getTotalEth(data);
    // 1 + 2 + (3*2) + (4*3) + (5*4) + 6 + 7 = 54
    expect(total).toBe(54n);
  });
});

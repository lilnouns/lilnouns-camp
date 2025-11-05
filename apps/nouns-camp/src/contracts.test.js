import { describe, expect, it } from "vitest";

import { resolveIdentifier } from "./contracts";

describe("contracts", () => {
  it("resolves nouns bidder contract", () => {
    const result = resolveIdentifier("nouns-bidder", { chainId: 1 });
    expect(result?.address.toLowerCase()).toBe(
      "0x3f09354832c67a27510601530c9e9f6ea39e2544",
    );
  });
});

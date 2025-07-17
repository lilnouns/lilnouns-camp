import { createPublicClient, http, fallback } from "viem";
import { CHAIN_ID } from "@/constants/env";
import { getChain } from "@/utils/chains";
import { getJsonRpcUrl, getAnkrJsonRpcUrl } from "@/wagmi-config";
import { CACHE_ONE_YEAR } from "next/constants";

// export const runtime = "edge";

const chain = getChain(CHAIN_ID);

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

const publicClient = createPublicClient({
  chain,
  transport: fallback([
    http(getJsonRpcUrl(chain.id)),
    http(getAnkrJsonRpcUrl(chain.id)),
  ]),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const blockNumber = searchParams.get("block");

  if (blockNumber == null)
    return Response.json({ code: "block-required" }, { status: 400 });

  const block = await publicClient.getBlock({
    blockNumber: BigInt(blockNumber),
  });

  return Response.json(
    { timestamp: Number(block.timestamp) },
    {
      headers: {
        "Cache-Control": `immutable, max-age=${ONE_YEAR_IN_SECONDS}, s-maxage=${CACHE_ONE_YEAR}`,
      },
    },
  );
}

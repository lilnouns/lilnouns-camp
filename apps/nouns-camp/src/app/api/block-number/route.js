import { createPublicClient, http, fallback } from "viem";
import { CHAIN_ID } from "@/constants/env";
import { getChain } from "@/utils/chains";
import { getJsonRpcUrl, getAnkrJsonRpcUrl } from "@/wagmi-config";

// export const runtime = "edge";

const chain = getChain(CHAIN_ID);

const MAX_AGE = 5; // 5 seconds

const publicClient = createPublicClient({
  chain,
  transport: fallback([
    http(getJsonRpcUrl(chain.id), {
      fetchOptions: {
        cache: "no-cache",
      },
    }),
    http(getAnkrJsonRpcUrl(chain.id), {
      fetchOptions: {
        cache: "no-cache",
      },
    }),
  ]),
});

export async function GET() {
  const blockNumber = await publicClient.getBlockNumber();

  return Response.json(
    { number: String(blockNumber) },
    {
      headers: {
        "Cache-Control": `immutable, s-maxage=${MAX_AGE}, max-age=${MAX_AGE}, stale-while-revalidate=${MAX_AGE * 2}`,
      },
    },
  );
}

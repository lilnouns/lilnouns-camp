import { createPublicClient, http, formatUnits, fallback } from "viem";
import { object as objectUtils } from "@shades/common/utils";
import { CHAIN_ID } from "@/constants/env";
import { resolveIdentifier as resolveContractIdentifier } from "@/contracts";
import { getChain } from "@/utils/chains";
import { getJsonRpcUrl, getAnkrJsonRpcUrl } from "@/wagmi-config";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const ONE_HOUR_IN_SECONDS = 60 * 60;

const chain = getChain(CHAIN_ID);

const publicClient = createPublicClient({
  chain,
  transport: fallback([
    http(getJsonRpcUrl(chain.id)),
    http(getAnkrJsonRpcUrl(chain.id)),
  ]),
});

const mainnetPublicClient =
  CHAIN_ID === 1
    ? publicClient
    : createPublicClient({
        chain,
        transport: fallback([
          http(getJsonRpcUrl(1)),
          http(getAnkrJsonRpcUrl(1)),
        ]),
      });

const balanceOf = ({ contract, account }) => {
  const address = resolveContractIdentifier(contract)?.address;
  return publicClient.readContract({
    address,
    chainId: CHAIN_ID,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        inputs: [{ type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: [account],
  });
};

export async function GET() {
  const {
    env: { CACHE },
  } = getCloudflareContext();

  // Try to get a cached response first
  const cacheKey = `treasury-data:${CHAIN_ID}`;

  if (CACHE) {
    try {
      const cachedResponse = await CACHE.get(cacheKey);
      if (cachedResponse) {
        const parsedResponse = JSON.parse(cachedResponse);
        return Response.json(parsedResponse.data, {
          headers: {
            "X-Cache": "HIT",
            "Cache-Control": `max-age=${ONE_HOUR_IN_SECONDS}, s-maxage=${ONE_HOUR_IN_SECONDS}, stale-while-revalidate=${ONE_HOUR_IN_SECONDS * 2}`,
          },
        });
      }
    } catch (cacheError) {
      console.warn("Cache read error:", cacheError);
    }
  }

  const executorAddress = resolveContractIdentifier("executor")?.address;
  const daoProxyAddress = resolveContractIdentifier("dao")?.address;
  // const clientIncentivesRewardsProxyAddress = resolveContractIdentifier(
  //   "client-incentives-rewards-proxy",
  // )?.address;
  // const forkEscrowAddress = resolveContractIdentifier("fork-escrow")?.address;
  const tokenBuyerAddress = resolveContractIdentifier("token-buyer")?.address;
  const payerAddress = resolveContractIdentifier("payer")?.address;

  const {
    executorBalances,
    daoProxyEthBalance,
    tokenBuyerEthBalance,
    // clientIncentivesRewardsProxyWethBalance,
    payerUsdcBalance,
    // forkEscrowNounsBalance,
    convertionRates,
    lidoApr,
    rocketPoolApr,
    originEtherApr,
    mantleApr,
  } = Object.fromEntries(
    await Promise.all([
      (async () => {
        const balances = Object.fromEntries(
          await Promise.all([
            publicClient
              .getBalance({ address: executorAddress })
              .then((balance) => ["eth", balance]),
            ...[
              { key: "weth", contract: "weth-token" },
              { key: "usdc", contract: "usdc-token" },
              { key: "steth", contract: "steth-token" },
              { key: "wsteth", contract: "wsteth-token" },
              CHAIN_ID === 1 ? { key: "reth", contract: "reth-token" } : null,
              CHAIN_ID === 1 ? { key: "oeth", contract: "oeth-token" } : null,
              CHAIN_ID === 1 ? { key: "meth", contract: "meth-token" } : null,
              { key: "nouns", contract: "nftx-vault" },
            ]
              .filter(Boolean)
              .map(async ({ key, contract }) => {
                let balance = await balanceOf({
                  contract,
                  account: executorAddress,
                });
                if (key === "nouns") {
                  balance = Math.floor(formatUnits(balance, 18) / 1.04);
                }
                return [key, balance];
              }),
          ]),
        );
        return ["executorBalances", balances];
      })(),
      ...[
        { key: "daoProxyEthBalance", address: daoProxyAddress },
        { key: "tokenBuyerEthBalance", address: tokenBuyerAddress },
      ].map(async ({ key, address }) => {
        const balance = await publicClient.getBalance({
          address,
        });
        return [key, balance];
      }),
      ...[
        // CHAIN_ID === 1
        //   ? {
        //       key: "clientIncentivesRewardsProxyWethBalance",
        //       contract: "weth-token",
        //       address: clientIncentivesRewardsProxyAddress,
        //     }
        //   : null,
        {
          key: "payerUsdcBalance",
          contract: "usdc-token",
          address: payerAddress,
        },
        // {
        //   key: "forkEscrowNounsBalance",
        //   contract: "token",
        //   address: forkEscrowAddress,
        // },
      ]
        .filter(Boolean)
        .map(async ({ key, contract, address }) => {
          const balance = await balanceOf({ contract, account: address });
          return [key, balance];
        }),
      (async () => {
        const [rethEth, usdcEth] = await Promise.all(
          [
            "chainlink-reth-eth-price-feed",
            "chainlink-usdc-eth-price-feed",
          ].map((contractIdentifier) =>
            mainnetPublicClient.readContract({
              address: resolveContractIdentifier(contractIdentifier, {
                chainId: 1,
              }).address,
              // chainId: 1,
              abi: [
                {
                  type: "function",
                  name: "latestAnswer",
                  inputs: [],
                  outputs: [{ type: "int256" }],
                },
              ],
              functionName: "latestAnswer",
            }),
          ),
        );

        const oethEth = await (async () => {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=origin-ether&vs_currencies=eth",
          );

          if (!res.ok) {
            throw new Error(
              `Failed to fetch from ${res.url}: ${res.status} ${res.statusText}`,
            );
          }

          const data = await res.json();
          const oethPriceInEth = data["origin-ether"].eth;

          return BigInt(oethPriceInEth * 10 ** 18);
        })();

        const methEth = await (async () => {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=mantle-staked-ether&vs_currencies=eth",
          );

          if (!res.ok) {
            throw new Error(
              `Failed to fetch from ${res.url}: ${res.status} ${res.statusText}`,
            );
          }

          const data = await res.json();
          const methPriceInEth = data["mantle-staked-ether"].eth;

          return BigInt(methPriceInEth * 10 ** 18);
        })();

        return ["convertionRates", { rethEth, usdcEth, oethEth, methEth }];
      })(),
      (async () => {
        const url = "https://eth-api.lido.fi/v1/protocol/steth/apr/sma";
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch from ${url}: ${res.status} ${res.statusText}`,
          );
        }
        const { data } = await res.json();
        return ["lidoApr", data.smaApr / 100];
      })(),
      (async () => {
        const url = "https://api.rocketpool.net/api/mainnet/payload";
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch from ${url}: ${res.status} ${res.statusText}`,
          );
        }
        const { rethAPR } = await res.json();
        return ["rocketPoolApr", Number(rethAPR) / 100];
      })(),
      (async () => {
        const url =
          "https://api.originprotocol.com/api/v2/oeth/apr/trailing/30";
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch from ${url}: ${res.status} ${res.statusText}`,
          );
        }
        const { apr } = await res.json();
        return ["originEtherApr", Number(apr) / 100];
      })(),
      (async () => {
        const url = "https://stake.mantle.xyz/api/meth/apr";
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch from ${url}: ${res.status} ${res.statusText}`,
          );
        }
        const { apr } = await res.json();
        return ["mantleApr", Number(apr) / 100];
      })(),
    ]),
  );

  // Cache for 1 hour
  const cacheTime = ONE_HOUR_IN_SECONDS;

  const responseData = {
    balances: {
      executor: objectUtils.mapValues(
        (v) => v?.toString() ?? null,
        executorBalances,
      ),
      "dao-proxy": { eth: daoProxyEthBalance.toString() },
      // "client-incentives-rewards-proxy": {
      //   weth: clientIncentivesRewardsProxyWethBalance?.toString() ?? null,
      // },
      "token-buyer": { eth: tokenBuyerEthBalance.toString() },
      payer: { usdc: payerUsdcBalance.toString() },
      // "fork-escrow": { nouns: forkEscrowNounsBalance.toString() },
    },
    rates: objectUtils.mapValues((v) => v.toString(), convertionRates),
    aprs: {
      lido: lidoApr,
      rocketPool: rocketPoolApr,
      originEther: originEtherApr,
      mantle: mantleApr,
    },
  };

  // Cache successful responses for 1 hour
  if (CACHE) {
    try {
      const cacheData = {
        data: responseData,
        timestamp: Date.now(),
      };

      await CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: cacheTime, // 1 hour in seconds
      });
    } catch (cacheError) {
      console.warn("Cache write error:", cacheError);
    }
  }

  return Response.json(responseData, {
    headers: {
      "X-Cache": "MISS",
      "Cache-Control": `max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`,
    },
  });
}

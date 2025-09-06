import { useQuery } from "@tanstack/react-query";
import { array as arrayUtils } from "@shades/common/utils";
import { subgraphFetch as queryNounsSubgraph } from "@/nouns-subgraph";

const useRecentAuctionProceeds = ({
  auctionCount = 30,
  enabled = true,
} = {}) => {
  const { data } = useQuery({
    queryKey: ["auction-proceeds", auctionCount],
    queryFn: async () => {
      const { auctions } = await queryNounsSubgraph({
        query: `{
          auctions(
            where: { settled: true, amount_gt: 0 },
            orderDirection: desc,
            orderBy: startTime,
            first: ${Math.min(1000, auctionCount)}
          ) {
            id
            amount
            startTime
          }
        }`,
      });

      const amounts = auctions.map(({ amount }) => BigInt(amount));
      const proceeds = amounts.reduce((sum, amount) => sum + amount, BigInt(0));
      const nounIds = arrayUtils.sortBy(
        (id) => Number(id),
        auctions.map(({ id }) => id),
      );
      const avgAuctionPrice = proceeds / BigInt(nounIds.length);

      const sortedAmounts = [...amounts].sort((a, b) =>
        a > b ? 1 : a < b ? -1 : 0,
      );
      const middle = Math.floor(sortedAmounts.length / 2);
      const medianAuctionPrice =
        sortedAmounts.length % 2 === 0
          ? (sortedAmounts[middle - 1] + sortedAmounts[middle]) / 2n
          : sortedAmounts[middle];

      const alphaNum = 2n;
      const alphaDen = BigInt(amounts.length + 1);
      let emaAuctionPrice = amounts[0];
      for (let i = 1; i < amounts.length; i++) {
        emaAuctionPrice =
          (amounts[i] * alphaNum + emaAuctionPrice * (alphaDen - alphaNum)) /
          alphaDen;
      }

      const varianceAuctionPrice =
        amounts.reduce((sum, amt) => sum + (amt - avgAuctionPrice) ** 2n, 0n) /
        BigInt(amounts.length);

      const firstTimestamp = Number(auctions[0]?.startTime ?? 0);
      const lastTimestamp = Number(
        auctions[auctions.length - 1]?.startTime ?? firstTimestamp,
      );
      const daySpan = (firstTimestamp - lastTimestamp) / (60 * 60 * 24);
      const auctionsPerDay =
        daySpan > 0 ? auctions.length / daySpan : auctions.length;

      return {
        totalAuctionProceeds: proceeds,
        auctionedNounIds: nounIds,
        avgAuctionPrice,
        medianAuctionPrice,
        emaAuctionPrice,
        varianceAuctionPrice,
        auctionsPerDay,
      };
    },
    enabled,
    staleTime: 1000 * 60 * 30,
  });

  return data;
};

export default useRecentAuctionProceeds;

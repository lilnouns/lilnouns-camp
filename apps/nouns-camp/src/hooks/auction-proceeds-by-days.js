import { useQuery } from "@tanstack/react-query";
import { array as arrayUtils } from "@shades/common/utils";
import { subgraphFetch as queryNounsSubgraph } from "@/nouns-subgraph";

// Fetch and compute auction proceeds for a rolling window of actual days.
// Returns totals and stats similar to useRecentAuctionProceeds, but the window
// is defined by a timestamp (now - days).
const useAuctionProceedsByDays = ({ days = 30, enabled = true } = {}) => {
  const { data } = useQuery({
    queryKey: ["auction-proceeds-by-days", days],
    queryFn: async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const since = nowSeconds - days * 24 * 60 * 60;

      const first = 1000;
      let skip = 0;
      const auctions = [];

      // Paginate until fewer than `first` results are returned
      // Order by startTime desc to match existing semantics
      // Note: skip-based pagination is sufficient for expected ranges.
      // If windows grow very large, consider startTime/id cursoring.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { auctions: page } = await queryNounsSubgraph({
          query: `{
            auctions(
              where: { settled: true, amount_gt: 0, startTime_gt: ${since} },
              orderDirection: desc,
              orderBy: startTime,
              first: ${first},
              skip: ${skip}
            ) {
              id
              amount
              startTime
            }
          }`,
        });

        auctions.push(...page);
        if (page.length < first) break;
        skip += first;
      }

      const amounts = auctions.map(({ amount }) => BigInt(amount));
      const proceeds = amounts.reduce((sum, amount) => sum + amount, 0n);
      const nounIds = arrayUtils.sortBy(
        (id) => Number(id),
        auctions.map(({ id }) => id),
      );

      // Stats with safe fallbacks for empty windows
      const count = amounts.length;
      const avgAuctionPrice = count > 0 ? proceeds / BigInt(count) : 0n;

      const sortedAmounts = [...amounts].sort((a, b) =>
        a > b ? 1 : a < b ? -1 : 0,
      );
      const middle = Math.floor(sortedAmounts.length / 2);
      const medianAuctionPrice =
        sortedAmounts.length === 0
          ? 0n
          : sortedAmounts.length % 2 === 0
            ? (sortedAmounts[middle - 1] + sortedAmounts[middle]) / 2n
            : sortedAmounts[middle];

      // Simple EMA similar to the count-based hook (alpha=2/(n+1))
      const alphaNum = 2n;
      const alphaDen = BigInt(count + 1);
      let emaAuctionPrice = 0n;
      if (count > 0) {
        emaAuctionPrice = amounts[0];
        for (let i = 1; i < amounts.length; i++) {
          emaAuctionPrice =
            (amounts[i] * alphaNum + emaAuctionPrice * (alphaDen - alphaNum)) /
            alphaDen;
        }
      }

      const varianceAuctionPrice =
        count === 0
          ? 0n
          : amounts.reduce(
              (sum, amt) => sum + (amt - avgAuctionPrice) ** 2n,
              0n,
            ) / BigInt(count);

      // For days-based window, use fixed days denominator to avoid edge cases
      const auctionsPerDay = days > 0 ? auctions.length / days : 0;

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

export default useAuctionProceedsByDays;

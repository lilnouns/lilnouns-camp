import { headers } from "next/headers";
import { notFound as nextNotFound } from "next/navigation";
import {
  string as stringUtils,
  markdown as markdownUtils,
  message as messageUtils,
} from "@shades/common/utils";
import metaConfig from "@/metadata-config";
import { getStateFromCookie as getWagmiStateFromCookie } from "../../../wagmi-config.js";
import { subgraphFetch, parseProposal } from "@/nouns-subgraph";
import { mainnet } from "../../../chains.js";
import { Hydrater as StoreHydrater } from "@/store";
import ClientAppProvider from "@/app/client-app-provider";
import ProposalScreen from "@/components/proposal-screen";

export const runtime = "edge";

const getChainId = () => {
  const wagmiState = getWagmiStateFromCookie(headers().get("cookie"));
  return wagmiState?.chainId ?? mainnet.id;
};

const fetchProposal = async (id, { chainId }) => {
  const data = await subgraphFetch({
    chainId,
    query: `
      query {
        proposal(id: ${id}) {
          id
          description
          status
          createdBlock
          createdTimestamp
          lastUpdatedBlock
          lastUpdatedTimestamp
          startBlock
          endBlock
        # updatePeriodEndBlock
        # objectionPeriodEndBlock
          canceledBlock
          canceledTimestamp
          queuedBlock
          queuedTimestamp
          executedBlock
          executedTimestamp
          forVotes
          againstVotes
          abstainVotes
          quorumVotes
          executionETA
          proposer {
            id
          }
        # signers {
        #   id
        # }
        }
      }`,
  });
  if (data?.proposal == null) return null;
  return parseProposal(data.proposal, { chainId });
};

export async function generateMetadata({ params, searchParams }) {
  const { item } = searchParams;
  const urlSearchParams = new URLSearchParams(searchParams);

  const proposal = await fetchProposal(params.id, { chainId: getChainId() });
  if (proposal == null) nextNotFound();

  const { title: parsedTitle, body } = proposal;

  const title =
    parsedTitle == null
      ? `Prop ${params.id}`
      : `${parsedTitle} (Prop ${params.id})`;

  const firstRegularParagraph = messageUtils.stringifyBlocks(
    markdownUtils.toMessageBlocks(markdownUtils.getFirstParagraph(body ?? "")),
  );

  const description = stringUtils.truncate(220, firstRegularParagraph);

  const canonicalUrl = `${metaConfig.canonicalAppBasename}/proposals/${params.id}?${urlSearchParams}`;
  const firstImage = markdownUtils.getFirstImage(body ?? "");

  const ogImage =
    item != null
      ? `${metaConfig.canonicalAppBasename}/api/og/vwrs?id=${item}`
      : (firstImage?.url ??
        `${metaConfig.canonicalAppBasename}/api/og?proposal=${params.id}`);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    twitter: {
      title,
      description,
      url: canonicalUrl,
      card: "summary_large_image",
      images: ogImage,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: ogImage,
    },
    other:
      item && firstImage?.url
        ? {}
        : {
            "fc:frame": "vNext",
            "fc:frame:image": ogImage,
            "fc:frame:button:1": "View proposal",
            "fc:frame:button:1:action": "link",
            "fc:frame:button:1:target": canonicalUrl,
          },
  };
}

export default async function Page({ params }) {
  const proposal = await fetchProposal(params.id, {
    chainId: getChainId(),
  });

  if (proposal == null) nextNotFound();

  return (
    <ClientAppProvider>
      <ProposalScreen proposalId={params.id} />
      <StoreHydrater state={{ proposalsById: { [proposal.id]: proposal } }} />
    </ClientAppProvider>
  );
}

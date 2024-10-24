import { notFound as nextNotFound } from "next/navigation";
import {
  string as stringUtils,
  markdown as markdownUtils,
  message as messageUtils,
} from "@shades/common/utils";
import metaConfig from "../../../metadata-config.js";
import { subgraphFetch, parseProposal } from "../../../nouns-subgraph.js";
import { Hydrater as StoreHydrater } from "../../../store.js";
import ClientAppProvider from "../../client-app-provider.js";
import ProposalScreen from "../../../components/proposal-screen.js";

export const runtime = "edge";

const fetchProposal = async (id) => {
  const data = await subgraphFetch({
    query: `
      query {
        proposal(id: ${id}) {
          id
          description
          status
          createdBlock
          createdTimestamp
        # lastUpdatedBlock
        # lastUpdatedTimestamp
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
  return parseProposal(data.proposal);
};

export async function generateMetadata({ params }) {
  const proposal = await fetchProposal(params.id);

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

  const canonicalUrl = `${metaConfig.canonicalAppBasename}/proposals/${params.id}`;

  const firstImage = markdownUtils.getFirstImage(body ?? "");

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    twitter: {
      title,
      description,
      url: canonicalUrl,
      card: firstImage?.url ? "summary_large_image" : "summary",
      images: firstImage?.url ?? "/opengraph-image.png",
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: firstImage?.url ?? "/opengraph-image.png",
    },
    other: firstImage?.url
      ? {} // start by showing frame only for proposals without images
      : {
          "fc:frame": "vNext",
          "fc:frame:image": `${metaConfig.canonicalAppBasename}/api/og?proposal=${params.id}`,
          "fc:frame:button:1": "View proposal",
          "fc:frame:button:1:action": "link",
          "fc:frame:button:1:target": canonicalUrl,
        },
  };
}

export default async function Page({ params }) {
  const proposal = await fetchProposal(params.id);

  if (proposal == null) nextNotFound();

  return (
    <ClientAppProvider>
      <ProposalScreen proposalId={params.id} />
      <StoreHydrater state={{ proposalsById: { [proposal.id]: proposal } }} />
    </ClientAppProvider>
  );
}

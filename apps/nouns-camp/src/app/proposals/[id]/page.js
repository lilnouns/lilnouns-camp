import { notFound as nextNotFound } from "next/navigation";
import {
  string as stringUtils,
  markdown as markdownUtils,
  message as messageUtils,
} from "@shades/common/utils";
import metaConfig from "@/metadata-config";
import { subgraphFetch, parseProposal } from "@/nouns-subgraph";
import { Hydrater as StoreHydrater } from "@/store";
import ClientAppProvider from "@/app/client-app-provider";
import ProposalScreen from "@/components/proposal-screen";

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
  return parseProposal(data.proposal);
};

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { item } = searchParams;
  const urlSearchParams = new URLSearchParams(searchParams);

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

  const canonicalUrl = `${metaConfig.canonicalAppBasename}/proposals/${params.id}?${urlSearchParams}`;
  const firstImage = { url: null }; // markdownUtils.getFirstImage(body ?? "");

  const ogImage =
    item != null
      ? `${metaConfig.canonicalAppBasename}/api/og/vwrs?id=${item}`
      : (firstImage?.url ??
        `${metaConfig.canonicalAppBasename}/api/og?proposal=${params.id}`);

  const miniappImage =
    item != null
      ? `${metaConfig.canonicalAppBasename}/api/og/vwrs?id=${item}&ratio=miniapp`
      : `${metaConfig.canonicalAppBasename}/api/og?proposal=${params.id}&ratio=miniapp`;

  // Farcaster miniapp configuration
  const miniappConfig = {
    version: "1",
    imageUrl: miniappImage,
    button: {
      title: metaConfig.miniappButtonTitle,
      action: {
        type: "launch_miniapp",
        url: canonicalUrl,
        name: metaConfig.miniappName,
        splashImageUrl: `${metaConfig.canonicalAppBasename}/apple-icon.png`,
        splashBackgroundColor: metaConfig.miniappSplashBackgroundColor,
      },
    },
  };

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
    other: {
      "fc:miniapp": JSON.stringify(miniappConfig),
    },
  };
}

export default async function Page(props) {
  const params = await props.params;
  const proposal = await fetchProposal(params.id);

  if (proposal == null) nextNotFound();

  return (
    <ClientAppProvider>
      <ProposalScreen proposalId={params.id} />
      <StoreHydrater state={{ proposalsById: { [proposal.id]: proposal } }} />
    </ClientAppProvider>
  );
}

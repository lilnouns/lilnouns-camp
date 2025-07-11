import { notFound as nextNotFound, permanentRedirect } from "next/navigation";
import {
  string as stringUtils,
  markdown as markdownUtils,
  message as messageUtils,
} from "@shades/common/utils";
import metaConfig from "@/metadata-config";
import { subgraphFetch, parseCandidate } from "@/nouns-subgraph";
import { normalizeId, makeUrlId } from "@/utils/candidates";
import { Hydrater as StoreHydrater } from "@/store";
import ClientAppProvider from "@/app/client-app-provider";
import CandidateScreen from "@/components/candidate-screen";

// export const runtime = "edge";

const fetchCandidate = async (id) => {
  const data = await subgraphFetch({
    query: `
      query($id: ID!) {
        proposalCandidate(id: $id) {
          id
          slug
          number
          proposer
          createdBlock
          canceledBlock
          lastUpdatedBlock
          canceledTimestamp
          createdTimestamp
          lastUpdatedTimestamp
          latestVersion {
            id
            content {
              description
              matchingProposalIds
              proposalIdToUpdate
            }
          }
        }
      }`,
    variables: {
      id,
    },
  });

  if (data?.proposalCandidate == null) return null;

  return parseCandidate(data.proposalCandidate);
};

const fetchCandidateByNumber = async (number) => {
  const data = await subgraphFetch({
    query: `
      query {
        proposalCandidates(where: {number: ${JSON.stringify(number)}}) {
          id
          slug
          number
          proposer
          createdBlock
          canceledBlock
          lastUpdatedBlock
          canceledTimestamp
          createdTimestamp
          lastUpdatedTimestamp
          latestVersion {
            id
            content {
              description
              matchingProposalIds
              proposalIdToUpdate
            }
          }
        }
      }`,
  });

  if (data?.proposalCandidates?.length === 0) return null;

  return parseCandidate(data.proposalCandidates[0]);
};

const parseId = (id) =>
  isNaN(Number(id)) ? normalizeId(decodeURIComponent(id)) : id;

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const candidateId = parseId(params.id);

  const candidate = isNaN(Number(params.id))
    ? await fetchCandidate(parseId(params.id))
    : await fetchCandidateByNumber(params.id);

  const { item } = searchParams;
  const urlSearchParams = new URLSearchParams(searchParams);

  // Can’t notFound() here since we might be on a testnet
  if (candidate == null) nextNotFound();

  const { title: parsedTitle, body } = candidate.latestVersion.content;

  const title = parsedTitle ?? "Untitled candidate";

  const firstRegularParagraph = messageUtils.stringifyBlocks(
    markdownUtils.toMessageBlocks(markdownUtils.getFirstParagraph(body ?? "")),
  );

  const description = stringUtils.truncate(220, firstRegularParagraph);

  const canonicalUrl = `${metaConfig.canonicalAppBasename}/candidates/${candidateId}?${urlSearchParams}`;

  const firstImage = markdownUtils.getFirstImage(body ?? "");

  const ogImage =
    item != null
      ? `${metaConfig.canonicalAppBasename}/api/og/vwrs?id=${item}`
      : (firstImage?.url ?? "/opengraph-image.png");

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    twitter: {
      title,
      description,
      url: canonicalUrl,
      card: item != null || firstImage?.url ? "summary_large_image" : "summary",
      images: ogImage,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: ogImage,
    },
  };
}

export default async function Page(props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const candidate = isNaN(Number(params.id))
    ? await fetchCandidate(parseId(params.id))
    : await fetchCandidateByNumber(params.id);

  if (candidate == null) nextNotFound();

  if (!isNaN(Number(params.id))) {
    const urlSearchParams = new URLSearchParams(searchParams);
    permanentRedirect(
      `/candidates/${encodeURIComponent(makeUrlId(candidate.id))}?${urlSearchParams}`,
    );
  }

  return (
    <ClientAppProvider>
      <CandidateScreen candidateId={candidate.id} />
      <StoreHydrater
        state={{ proposalCandidatesById: { [candidate.id]: candidate } }}
      />
    </ClientAppProvider>
  );
}

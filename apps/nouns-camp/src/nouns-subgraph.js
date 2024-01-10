import {
  array as arrayUtils,
  object as objectUtils,
} from "@shades/common/utils";
import { mainnet, sepolia, goerli } from "./chains.js";
import { parse as parseTransactions } from "./utils/transactions.js";

const customSubgraphEndpoint =
  typeof location === "undefined"
    ? null
    : new URLSearchParams(location.search).get("nouns-subgraph");

const subgraphEndpointByChainId = {
  [mainnet.id]: process.env.NEXT_PUBLIC_NOUNS_MAINNET_SUBGRAPH_URL,
  [sepolia.id]: process.env.NEXT_PUBLIC_NOUNS_SEPOLIA_SUBGRAPH_URL,
  [goerli.id]: process.env.NEXT_PUBLIC_NOUNS_GOERLI_SUBGRAPH_URL,
};

const parseTimestamp = (unixSeconds) => new Date(parseInt(unixSeconds) * 1000);

const VOTE_FIELDS = `
fragment VoteFields on Vote {
  id
  blockNumber
  reason
  supportDetailed
  votes
  voter {
    id
  }
  proposal {
    id
  }
}`;

const FULL_PROPOSAL_FIELDS = `
${VOTE_FIELDS}
fragment FullProposalFields on Proposal {
  id
  status
  title
  description
  createdBlock
  createdTimestamp
  startBlock
  endBlock
  targets
  signatures
  calldatas
  values
  forVotes
  againstVotes
  abstainVotes
  executionETA
  quorumVotes
  proposer {
    id
  }
  votes {
    ...VoteFields
  }
}`;
const createDelegatesQuery = (optionalAccountIds) => `
query {
  delegates(first: 1000, where: ${
    optionalAccountIds == null
      ? "{nounsRepresented_: {}}"
      : `{id_in: [${optionalAccountIds.map((id) => `"${id.toLowerCase()}"`)}]}`
  }) {
    id
    delegatedVotes
    nounsRepresented {
      id
      seed {
        head
        glasses
        body
        background
        accessory
      }
      owner {
        id
        delegate {
          id
        }
      }
    }
  }
}`;

const createDelegateQuery = (id) => `
  ${VOTE_FIELDS}
  query {
    delegate(id: "${id}") {
      id
      delegatedVotes
      nounsRepresented {
        id
        seed {
          head
          glasses
          body
          background
          accessory
        }
        owner {
          id
          delegate {
            id
          }
        }
      }
      votes (first: 1000, orderBy: blockNumber, orderDirection: desc) {
        ...VoteFields
      }
      proposals (first: 1000, orderBy: createdBlock, orderDirection: desc) {
        id
        description
        title
        status
        createdBlock
        createdTimestamp
        startBlock
        endBlock
        forVotes
        againstVotes
        abstainVotes
        quorumVotes
        executionETA
        proposer {
          id
        }
      }
    }
}`;

const createAccountQuery = (id) => `
  query {
    account(id: "${id}") {
      id
      delegate {
        id
      }
      nouns {
        id
        seed {
          head
          glasses
          body
          background
          accessory
        }
        owner {
          id
          delegate {
            id
          }
        }
      }
    }
  }
`;

const createBrowseScreenQuery = ({ skip = 0, first = 1000 } = {}) => `
query {
  proposals(orderBy: createdBlock, orderDirection: desc, skip: ${skip}, first: ${first}) {
    id
    title
    status
    createdBlock
    createdTimestamp
    startBlock
    endBlock
    forVotes
    againstVotes
    abstainVotes
    quorumVotes
    executionETA
    proposer {
      id
    }
  }
}`;

// TODO: proposal feedbacks
const createBrowseScreenSecondaryQuery = ({
  proposalIds,
} = {}) => `
${VOTE_FIELDS}
query {
  proposals(where: {id_in: [${proposalIds.map((id) => `"${id}"`)}]}) {
    id
    votes {
      ...VoteFields
    }
  }
}`;

const createVoterScreenQuery = (id, { skip = 0, first = 1000 } = {}) => `
${VOTE_FIELDS}
query {
  proposals(orderBy: createdBlock, orderDirection: desc, skip: ${skip}, first: ${first}, where: {proposer: "${id}"} ) {
    id
    description
    title
    status
    createdBlock
    createdTimestamp
    startBlock
    endBlock
    forVotes
    againstVotes
    abstainVotes
    quorumVotes
    executionETA
    proposer {
      id
    }
    votes {
      ...VoteFields
    }
  }

  votes (orderBy: blockNumber, orderDirection: desc, skip: ${skip}, first: ${first}, where: {voter: "${id}"}) {
    ...VoteFields
  }
  nouns (where: {owner: "${id}"}) {
    id
    seed {
      head
      glasses
      body
      background
      accessory
    }
    owner {
      id
      delegate {
        id
      }
    }
  }
}`;
const createProposalQuery = (id) => `
${FULL_PROPOSAL_FIELDS}
query {
  proposal(id: "${id}") {
    ...FullProposalFields
  }
}`;
const createProposalsQuery = (proposalIds) => `
${FULL_PROPOSAL_FIELDS}
query {
  proposals(where: {id_in: [${proposalIds.map((id) => `"${id}"`)}]}) {
    ...FullProposalFields
  }
}`;

const createActiveProposalQuery = (currentBlock) => `
${FULL_PROPOSAL_FIELDS}
query {
  proposals(
    where: {
      and: [
        { status_not_in: [CANCELLED, VETOED] },
        {
          or: [
            { endBlock_gt: ${currentBlock} },
          ]
        }
      ]
    }
  ) {
    ...FullProposalFields 
  }
}`;
const createNounsByIdsQuery = (ids) => `
query {
  nouns(where: {id_in: [${ids.map((id) => `"${id}"`)}]}) {
    id
    seed {
      head
      glasses
      body
      background
      accessory
    }
    owner {
      id
      delegate {
        id
      }
    }
  }
  transferEvents(orderBy: blockNumber, orderDirection: desc, where: {noun_in: [${ids.map(
    (id) => `"${id}"`
  )}]}) {
    id
    noun {
      id
    }
    newHolder {
      id
    }
    previousHolder {
      id
    }
    blockNumber
    blockTimestamp
  }
  delegationEvents(orderBy: blockNumber, orderDirection: desc, where: {noun_in: [${ids.map(
    (id) => `"${id}"`
  )}]}) {
    id
    noun {
      id
    }
    newDelegate {
      id
    }
    previousDelegate {
      id
    }
    blockNumber
    blockTimestamp
  }
  auctions(where: {noun_in: [${ids.map((id) => `"${id}"`)}]}) {
    id
    amount
    startTime
  }
}`;
const createNounsActivityDataQuery = ({ startBlock, endBlock }) => `
${VOTE_FIELDS}
query {
  votes(where: {blockNumber_gte: ${startBlock}, blockNumber_lte: ${endBlock}}, orderBy: blockNumber, orderDirection: desc, first: 1000) {
    ...VoteFields
    proposal {
      id
    }
  }
}`;

const createVoterActivityDataQuery = (id, { startBlock, endBlock }) => `
${VOTE_FIELDS}
query {
  votes(where: {voter: "${id}", blockNumber_gte: ${startBlock}, blockNumber_lte: ${endBlock}}, orderBy: blockNumber, orderDirection: desc, first: 1000) {
    ...VoteFields
    proposal {
      id
    }
  }
}`;

export const subgraphFetch = async ({
  endpoint,
  chainId,
  operationName,
  query,
  variables,
}) => {
  const url =
    endpoint ?? customSubgraphEndpoint ?? subgraphEndpointByChainId[chainId];

  if (url == null) throw new Error();

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operationName, query, variables }),
  })
    .then((res) => {
      if (res.ok) return res.json();
      return Promise.reject(new Error(res.statusText));
    })
    .then((body) => body.data);
};

const parseMarkdownDescription = (string) => {
  const [firstLine, ...restLines] = string.split("\n");
  const startIndex = [...firstLine].findIndex((c) => c !== "#");
  const hasTitle = startIndex > 0;
  const title = hasTitle ? firstLine.slice(startIndex).trim() : null;
  const body = hasTitle ? restLines.join("\n").trim() : string;
  return { title, body };
};

const parseFeedbackPost = (post) => ({
  id: post.id,
  reason: post.reason,
  support: post.supportDetailed,
  createdBlock: BigInt(post.createdBlock),
  createdTimestamp: parseTimestamp(post.createdTimestamp),
  votes: Number(post.votes),
  proposalId: post.proposal?.id,
  voterId: post.voter.id,
  voter: post.voter,
});

const parseProposalVote = (v) => ({
  id: v.id,
  createdBlock: BigInt(v.blockNumber),
  createdTimestamp: parseTimestamp(v.blockTimestamp),
  reason: v.reason,
  support: v.supportDetailed,
  votes: Number(v.votes),
  voterId: v.voter.id,
  proposalId: v.proposal?.id,
});

const parseProposalVersion = (v) => ({
  updateMessage: v.updateMessage,
  createdBlock: BigInt(v.createdBlock),
  createdTimestamp: parseTimestamp(v.createdAt),
  proposalId: v.proposal?.id,
});

export const parseProposal = (data, { chainId }) => {
  const parsedData = { ...data };

  // Block numbers
  for (const prop of [
    "createdBlock",
    "startBlock",
    "endBlock",
  ]) {
    if (data[prop] === "0") {
      parsedData[prop] = null;
    } else if (data[prop] != null) {
      parsedData[prop] = BigInt(data[prop]);
    }
  }

  // Timestamps
  for (const prop of [
    "createdTimestamp",
  ]) {
    if (data[prop] != null) {
      parsedData[prop] = parseTimestamp(data[prop]);
    }
  }

  if (data.executionETA !== undefined)
    parsedData.executionEtaTimestamp =
      data.executionETA == null ? null : parseTimestamp(data.executionETA);

  // Regular numbers
  for (const prop of ["forVotes", "againstVotes", "abstainVotes"]) {
    if (data[prop] != null) {
      parsedData[prop] = Number(data[prop]);
    }
  }

  if (data.description != null) {
    const { title, body } = parseMarkdownDescription(data.description);
    parsedData.title = title;
    parsedData.body = body;
  }

  if (data.feedbackPosts != null)
    parsedData.feedbackPosts = data.feedbackPosts.map(parseFeedbackPost);

  if (data.versions != null)
    parsedData.versions = data.versions.map(parseProposalVersion);

  if (data.votes != null)
    parsedData.votes = data.votes
      .map(parseProposalVote)
      .filter((v) => !hideProposalVote(v));

  if (data.proposer?.id != null) parsedData.proposerId = data.proposer.id;

  if (data.targets != null)
    parsedData.transactions = parseTransactions(data, { chainId });

  return parsedData;
};

// Hide proposal votes from 0 voting power account if no reason is given
const hideProposalVote = (v) =>
  v.votes === 0 && (v.reason?.trim() ?? "") === "";

const parseCandidateVersion = (v, { chainId }) => {
  const parsedVersion = { ...v };

  if (v.createdBlock != null)
    parsedVersion.createdBlock = BigInt(v.createdBlock);

  if (v.createdTimestamp != null)
    parsedVersion.createdTimestamp = parseTimestamp(v.createdTimestamp);

  if (v.content?.description != null) {
    const { title, body } = parseMarkdownDescription(v.content.description);

    parsedVersion.content.title = title;
    parsedVersion.content.body = body;
  }

  if (v.content?.matchingProposalIds != null)
    parsedVersion.proposalId = v.content.matchingProposalIds[0];

  if ((v.content?.proposalIdToUpdate ?? "0") !== "0")
    parsedVersion.targetProposalId = v.content.proposalIdToUpdate;

  if (v.content?.contentSignatures != null)
    parsedVersion.content.contentSignatures = v.content.contentSignatures.map(
        (s) => ({
          ...s,
          createdBlock: BigInt(s.createdBlock),
          createdTimestamp: parseTimestamp(s.createdTimestamp),
          expirationTimestamp: parseTimestamp(s.expirationTimestamp),
        })
    );

  if (v.content?.targets != null)
    parsedVersion.content.transactions = parseTransactions(v.content, {
      chainId,
    });

  if (v.proposal != null) parsedVersion.candidateId = v.proposal.id;

  return parsedVersion;
};

export const parseCandidate = (data, { chainId }) => {
  const parsedData = {
    ...data,
    latestVersion: {
      ...data.latestVersion,
      content: { ...data.latestVersion.content },
    },
  };

  parsedData.proposerId = data.proposer;

  // Block numbers
  for (const prop of ["createdBlock", "canceledBlock", "lastUpdatedBlock"]) {
    if (data[prop] === "0") {
      parsedData[prop] = null;
    } else if (data[prop] != null) {
      parsedData[prop] = BigInt(data[prop]);
    }
  }

  // Timestamps
  for (const prop of [
    "createdTimestamp",
    "lastUpdatedTimestamp",
    "canceledTimestamp",
  ]) {
    if (data[prop] != null) {
      parsedData[prop] = parseTimestamp(data[prop]);
    }
  }

  if (data.latestVersion != null)
    parsedData.latestVersion = parseCandidateVersion(data.latestVersion, {
      chainId,
    });

  if (data.feedbackPosts != null)
    parsedData.feedbackPosts = data.feedbackPosts.map(parseFeedbackPost);

  if (data.versions != null)
    parsedData.versions = data.versions.map((v) =>
        parseCandidateVersion(v, { chainId })
    );

  return parsedData;
};

const parseDelegate = (data) => {
  const parsedData = { ...data };

  parsedData.delegatedVotes = parseInt(data.delegatedVotes);

  parsedData.nounsRepresented = arrayUtils.sortBy(
    (n) => parseInt(n.id),
    data.nounsRepresented
      .map((n) => ({
        ...n,
        seed: objectUtils.mapValues((v) => parseInt(v), n.seed),
        ownerId: n.owner?.id,
        delegateId: n.owner?.delegate?.id,
      }))
      // Don’t include nouns delegated to other accounts
      .filter((n) => n.delegateId == null || n.delegateId === data.id)
  );

  if (data.votes != null) parsedData.votes = data.votes.map(parseProposalVote);

  if (data.proposals != null)
    parsedData.proposals = data.proposals.map(parseProposal);

  return parsedData;
};

const parseAccount = (data) => {
  const parsedData = { ...data };

  parsedData.nouns = arrayUtils.sortBy(
    (n) => parseInt(n.id),
    data.nouns.map((n) => ({
      ...n,
      seed: objectUtils.mapValues((v) => parseInt(v), n.seed),
      ownerId: n.owner?.id,
      delegateId: n.owner?.delegate?.id,
    }))
  );

  parsedData.delegateId = data.delegate?.id;
  return parsedData;
};

const parseNoun = (data) => {
  const parsedData = { ...data };

  parsedData.seed = objectUtils.mapValues((v) => parseInt(v), data.seed);
  parsedData.ownerId = data.owner?.id;
  parsedData.delegateId = data.owner.delegate?.id;

  return parsedData;
};
export const fetchProposals = async (chainId, proposalIds) => {
  if (!proposalIds || proposalIds.length === 0) return [];
  return subgraphFetch({
    chainId,
    query: createProposalsQuery(proposalIds),
  }).then((data) => {
    return data.proposals.map((p) => parseProposal(p, { chainId }));
  });
};

export const fetchActiveProposals = async (chainId, currentBlock) => {
  return subgraphFetch({
    chainId,
    query: createActiveProposalQuery(currentBlock),
  }).then((data) => {
    return data.proposals.map((p) => parseProposal(p, { chainId }));
  });
};
export const fetchProposal = (chainId, id) =>
  subgraphFetch({ chainId, query: createProposalQuery(id) }).then((data) => {
    if (data.proposal == null) return Promise.reject(new Error("not-found"));
    return parseProposal(
      { ...data.proposal },
      { chainId }
    );
  });

export const fetchDelegates = (chainId, optionalAccountIds) =>
  subgraphFetch({
    chainId,
    query: createDelegatesQuery(optionalAccountIds),
  }).then((data) => {
    return data.delegates.map(parseDelegate);
  });

export const fetchDelegate = (chainId, id) =>
  subgraphFetch({
    chainId,
    query: createDelegateQuery(id.toLowerCase()),
  }).then((data) => {
    if (data.delegate == null) return Promise.reject(new Error("not-found"));
    return parseDelegate(data.delegate);
  });

export const fetchAccount = (chainId, id) =>
  subgraphFetch({
    chainId,
    query: createAccountQuery(id?.toLowerCase()),
  }).then((data) => {
    if (data.account == null) return Promise.reject(new Error("not-found"));
    return parseAccount(data.account);
  });
export const fetchBrowseScreenData = (chainId, options) =>
  subgraphFetch({ chainId, query: createBrowseScreenQuery(options) }).then(
    (data) => {
      const proposals = data.proposals.map((p) =>
        parseProposal(p, { chainId })
      );
      return { proposals };
    }
  );

export const fetchBrowseScreenSecondaryData = (chainId, options) =>
  subgraphFetch({
    chainId,
    query: createBrowseScreenSecondaryQuery(options),
  }).then((data) => {
    const proposals = data.proposals.map((p) => parseProposal(p, { chainId }));
    return {
      proposals,
    };
  });
export const fetchVoterScreenData = (chainId, id, options) =>
  subgraphFetch({
    chainId,
    query: createVoterScreenQuery(id.toLowerCase(), options),
  }).then((data) => {
    const proposals = data.proposals.map((p) => parseProposal(p, { chainId }));
    const votes = data.votes.map(parseProposalVote);
    const nouns = data.nouns.map(parseNoun);

    return {
      proposals,
      votes,
      nouns,
    };
  });

export const fetchNounsActivity = (chainId, { startBlock, endBlock }) =>
  subgraphFetch({
    chainId,
    query: createNounsActivityDataQuery({
      startBlock: startBlock.toString(),
      endBlock: endBlock.toString(),
    }),
  }).then((data) => {

    const votes = data.votes
      .map(parseProposalVote)
      .filter((v) => !hideProposalVote(v));

    return { votes };
  });

export const fetchVoterActivity = (
  chainId,
  voterAddress,
  { startBlock, endBlock }
) =>
  subgraphFetch({
    chainId,
    query: createVoterActivityDataQuery(voterAddress?.toLowerCase(), {
      startBlock: startBlock.toString(),
      endBlock: endBlock.toString(),
    }),
  }).then((data) => {
    const votes = data.votes.map(parseProposalVote);

    return { votes };
  });

export const fetchNounsByIds = (chainId, ids) =>
  subgraphFetch({
    chainId,
    query: createNounsByIdsQuery(ids),
  }).then((data) => {
    const nouns = data.nouns.map(parseNoun);

    const transferEvents = data.transferEvents.map((e) => ({
      ...e,
      blockTimestamp: parseTimestamp(e.blockTimestamp),
      newAccountId: e.newHolder?.id,
      previousAccountId: e.previousHolder?.id,
      nounId: e.noun?.id,
      type: "transfer",
    }));
    const delegationEvents = data.delegationEvents.map((e) => ({
      ...e,
      blockTimestamp: parseTimestamp(e.blockTimestamp),
      newAccountId: e.newDelegate?.id,
      previousAccountId: e.previousDelegate?.id,
      nounId: e.noun?.id,
      type: "delegate",
    }));

    const auctions = data.auctions.map((a) => ({
      ...a,
      startTime: parseTimestamp(a.startTime),
    }));

    const getEventScore = (event) => {
      // delegate events should come last chronologically
      if (event.type === "transfer") return 0;
      if (event.type === "delegate") return 1;
      else return -1;
    };

    const sortedEvents = arrayUtils.sortBy(
      { value: (e) => e.blockTimestamp, order: "desc" },
      { value: (e) => getEventScore(e), order: "desc" },
      [...transferEvents, ...delegationEvents]
    );

    return { nouns, events: sortedEvents, auctions };
  });

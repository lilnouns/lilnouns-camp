import React from "react";
import {
  createStore as createZustandStore,
  useStore as useZustandStore,
} from "zustand";
import { useBlockNumber } from "wagmi";
import { useFetch, useLatestCallback } from "@shades/common/react";
import {
  array as arrayUtils,
  object as objectUtils,
} from "@shades/common/utils";
import {
  getState as getProposalState,
  isActiveState as isActiveProposalState,
} from "./utils/proposals.js";
import useChainId from "./hooks/chain-id.js";
import * as NounsSubgraph from "./nouns-subgraph.js";
import * as PropdatesSubgraph from "./propdates-subgraph.js";

const mergeProposals = (p1, p2) => {
  if (p1 == null) return p2;

  const mergedProposal = { ...p1, ...p2 };

  if (p1.feedbackPosts != null && p2.feedbackPosts != null)
    mergedProposal.feedbackPosts = arrayUtils.unique(
      (p1, p2) => p1.id === p2.id,
      [...p1.feedbackPosts, ...p2.feedbackPosts]
    );

  if (p1.votes != null && p2.votes != null)
    mergedProposal.votes = arrayUtils.unique(
      (v1, v2) => {
        if (v1.id === v2.id) return true;
        if (!v1.isPending) return false;
        return v1.voterId.toLowerCase() === v2.voterId.toLowerCase();
      },
      // p2 has to be first here to take precedence
      [...p2.votes, ...p1.votes]
    );

  return mergedProposal;
};

const mergeDelegates = (d1, d2) => {
  if (d1 == null) return d2;

  const mergedDelegate = { ...d1, ...d2 };

  if (d1.proposals != null && d2.proposals != null)
    mergedDelegate.proposals = arrayUtils.unique(
      (p1, p2) => p1.id === p2.id,
      [...d1.proposals, ...d2.proposals]
    );

  if (d1.votes != null && d2.votes != null)
    mergedDelegate.votes = arrayUtils.unique(
      (v1, v2) => v1.id === v2.id,
      [...d1.votes, ...d2.votes]
    );

  return mergedDelegate;
};

const createStore = ({ initialState }) =>
  createZustandStore((set) => {
    const fetchProposals = async (chainId, ids) =>
    NounsSubgraph.fetchProposals(chainId, ids).then((proposals) => {
      set((s) => {
        const fetchedProposalsById = arrayUtils.indexBy((p) => p.id, proposals);

        return {
          proposalsById: objectUtils.merge(
            mergeProposals,
            s.proposalsById,
            fetchedProposalsById
          ),
        };
      });
    });
    const fetchNounsByIds = async (chainId, ids) =>
    NounsSubgraph.fetchNounsByIds(chainId, ids).then(
      ({ nouns, events, auctions }) => {
        set((s) => {
          const eventsByNounId = arrayUtils.groupBy((e) => e.nounId, events);
          const auctionsByNounId = arrayUtils.groupBy((e) => e.id, auctions);
          nouns.forEach((n) => {
            const events = eventsByNounId[n.id] ?? [];
            n.events = events;
            n.auction = auctionsByNounId[n.id]?.[0];
          });

            return {
              nounsById: {
                ...s.nounsById,
                ...arrayUtils.indexBy((n) => n.id, nouns),
              },
            };
          });
        }
      );

    return {
      accountsById: {},
      delegatesById: {},
      nounsById: {},
      proposalsById: {},
      proposalCandidatesById: {},
      propdatesByProposalId: {},
      ...initialState,

      // UI actions
      addOptimitisicProposalVote: (proposalId, vote) => {
        set((s) => {
          const proposal = s.proposalsById[proposalId];

        return {
          proposalsById: {
            ...s.proposalsById,
            [proposalId]: mergeProposals(proposal, {
              votes: [{ ...vote, isPending: true }],
            }),
          },
        };
      });
    },

      // Actions
      fetchProposals,
      fetchProposal: (chainId, id) =>
        NounsSubgraph.fetchProposal(chainId, id).then((proposal) => {
          set((s) => ({
          proposalsById: {
            ...s.proposalsById,
            [id]: mergeProposals(s.proposalsById[id], proposal),
          },
        }));
      }),
    fetchActiveProposals: (chainId, ...args) =>
      NounsSubgraph.fetchActiveProposals(chainId, ...args).then((proposals) => {
        set((s) => {
          const fetchedProposalsById = arrayUtils.indexBy(
            (p) => p.id,
            proposals
          );

          return {
            proposalsById: objectUtils.merge(
              mergeProposals,
              s.proposalsById,
              fetchedProposalsById
            ),
          };
        });
      }),
    fetchDelegates: (chainId, optionalAccountIds) =>
      NounsSubgraph.fetchDelegates(chainId, optionalAccountIds).then(
        (delegates) => {
          const delegatesByIds = arrayUtils.indexBy(
            (d) => d.id.toLowerCase(),
            delegates
          );

            set((s) => ({
              delegatesById: objectUtils.merge(
                mergeDelegates,
                s.delegatesById,
                delegatesByIds
              ),
            }));
          }
        ),
      fetchDelegate: (chainId, id) =>
        NounsSubgraph.fetchDelegate(chainId, id).then((delegate) => {
          const createdProposalsById = arrayUtils.indexBy(
            (p) => p.id,
            delegate.proposals
          );

          const nounIds = arrayUtils.unique(
            delegate.nounsRepresented.map((n) => n.id)
          );

          // fetch nouns async ...
          fetchNounsByIds(chainId, nounIds);

          set((s) => ({
            delegatesById: {
              ...s.delegatesById,
              [id.toLowerCase()]: delegate,
            },
            proposalsById: objectUtils.merge(
              mergeProposals,
              s.proposalsById,
              createdProposalsById
            ),
          }));
        }),
      fetchAccount: (chainId, id) =>
        NounsSubgraph.fetchAccount(chainId, id).then((account) => {
          const nounIds = arrayUtils.unique(account.nouns.map((n) => n.id));

          // fetch nouns async ...
          fetchNounsByIds(chainId, nounIds);

          set((s) => ({
            accountsById: {
              ...s.accountsById,
              [id?.toLowerCase()]: account,
            },
          }));
        }),
      fetchNoun: (chainId, id) => fetchNounsByIds(chainId, [id]),
      fetchBrowseScreenData: (chainId, options) =>
      NounsSubgraph.fetchBrowseScreenData(chainId, options).then(
        ({ proposals}) => {
          // Fetch less urgent data async
          NounsSubgraph.fetchBrowseScreenSecondaryData(chainId, {
            proposalIds: proposals.map((p) => p.id),
            }).then(
              ({
                proposals
              }) => {
                const proposalsById = arrayUtils.indexBy(
                  (p) => p.id,
                  proposals
                );

                set((s) => ({
                proposalsById: objectUtils.merge(
                  mergeProposals,
                  s.proposalsById,
                  proposalsById,
                  ),
                }));
              }
            );

            const fetchedProposalsById = arrayUtils.indexBy(
              (p) => p.id,
              proposals
            );

            set((s) => ({
            proposalsById: objectUtils.merge(
              mergeProposals,
              s.proposalsById,
              fetchedProposalsById
            ),
          }));
        }
      ),
    fetchVoterScreenData: (chainId, id, options) => {
      return Promise.all([
        NounsSubgraph.fetchVoterScreenData(chainId, id, options).then(
          ({
            proposals,
            votes,
               nouns,
           }) => {
              const createdProposalsById = arrayUtils.indexBy(
                (p) => p.id,
                proposals
              );

              const propIds = arrayUtils.unique(
                [...votes].map((p) => p.proposalId)
              );

            // Fetch proposals voted or commented on by voter
            fetchProposals(chainId, propIds);
              arrayUtils.indexBy(
                  (p) => p.id.toLowerCase(),
              );

              const nounIds = nouns.map((n) => n.id);

              // fetch nouns async ...
              fetchNounsByIds(chainId, nounIds);

              set((s) => ({
                  proposalsById: objectUtils.merge(
                      mergeProposals,
                      s.proposalsById,
                      createdProposalsById
                  )
                }));
          }

          ),
        ]);
      },
      fetchNounsActivity: (chainId, { startBlock, endBlock }) =>
        Promise.all([
          NounsSubgraph.fetchNounsActivity(chainId, { startBlock, endBlock }),
          PropdatesSubgraph.fetchPropdates(chainId, { startBlock, endBlock }),
        ]).then(
          ([
            { votes},
          propdates,
        ]) => {
          set((s) => {
              const votesByProposalId = arrayUtils.groupBy(
                (v) => v.proposalId,
                votes
              );

              const proposalsWithNewVotesById = objectUtils.mapValues(
              (votes, proposalId) => ({
                id: proposalId,
                votes,
              }),
              votesByProposalId
            );

              return {
                proposalsById: objectUtils.merge(
                  mergeProposals,
                  s.proposalsById,
                  proposalsWithNewVotesById
                ),
                propdatesByProposalId: objectUtils.merge(
                  (ps1 = [], ps2 = []) =>
                    arrayUtils.unique(
                      (p1, p2) => p1.id === p2.id,
                      [...ps1, ...ps2]
                    ),
                  s.propdatesByProposalId,
                  arrayUtils.groupBy((d) => d.proposalId, propdates)
                ),
              };
            });
          }
        ),

      fetchVoterActivity: (chainId, voterAddress, { startBlock, endBlock }) =>
        NounsSubgraph.fetchVoterActivity(chainId, voterAddress, {
          startBlock,
          endBlock,
        }).then(({ votes}) => {
          const propIds = arrayUtils.unique(
            [...votes].map((p) => p.proposalId)
          );

          fetchProposals(chainId, propIds);

          set((s) => {

            const votesByProposalId = arrayUtils.groupBy(
            (v) => v.proposalId,
            votes
          );

            const proposalsWithNewVotesById = objectUtils.mapValues(
            (votes, proposalId) => ({
              id: proposalId,
              votes,
            }),
            votesByProposalId
          );

            return {
              proposalsById: objectUtils.merge(
                mergeProposals,
                s.proposalsById,
                proposalsWithNewVotesById
              ),
            };
          });
        }),
      fetchPropdatesForProposal: (chainId, ...args) =>
        PropdatesSubgraph.fetchPropdatesForProposal(chainId, ...args).then(
          (propdates) => {
            set((s) => ({
              propdatesByProposalId: objectUtils.merge(
                (ps1 = [], ps2 = []) =>
                  arrayUtils.unique(
                    (p1, p2) => p1.id === p2.id,
                    [...ps1, ...ps2]
                  ),
                s.propdatesByProposalId,
                arrayUtils.groupBy((d) => d.proposalId, propdates)
              ),
            }));
          }
        ),
    };
  });

const StoreContext = React.createContext();

export const Provider = ({ children, initialState }) => {
  const storeRef = React.useRef();

  if (storeRef.current == null) {
    storeRef.current = createStore({ initialState });
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
};

const useStore = (selector) => {
  const store = React.useContext(StoreContext);
  if (store == null)
    throw new Error(
      "`useStore` cannot be used without a parent store provider"
    );
  return useZustandStore(store, selector);
};

export const useActions = () => {
  const chainId = useChainId();
  const fetchProposal = useStore((s) => s.fetchProposal);
  const fetchProposals = useStore((s) => s.fetchProposals);
  const fetchActiveProposals = useStore((s) => s.fetchActiveProposals);
  const fetchDelegates = useStore((s) => s.fetchDelegates);
  const fetchDelegate = useStore((s) => s.fetchDelegate);
  const fetchAccount = useStore((s) => s.fetchAccount);
  const fetchNoun = useStore((s) => s.fetchNoun);
  const fetchNounsActivity = useStore((s) => s.fetchNounsActivity);
  const fetchVoterActivity = useStore((s) => s.fetchVoterActivity);
  const fetchBrowseScreenData = useStore((s) => s.fetchBrowseScreenData);
  const fetchVoterScreenData = useStore((s) => s.fetchVoterScreenData);
  const fetchPropdatesForProposal = useStore(
    (s) => s.fetchPropdatesForProposal
  );
  const addOptimitisicProposalVote = useStore(
    (s) => s.addOptimitisicProposalVote
  );
  const addOptimitisicCandidateFeedbackPost = useStore(
    (s) => s.addOptimitisicCandidateFeedbackPost
  );

  return {
    fetchProposal: React.useCallback(
      (...args) => fetchProposal(chainId, ...args),
      [fetchProposal, chainId]
    ),
    fetchProposals: React.useCallback(
      (...args) => fetchProposals(chainId, ...args),
      [fetchProposals, chainId]
    ),
    fetchActiveProposals: React.useCallback(
      (...args) => fetchActiveProposals(chainId, ...args),
      [fetchActiveProposals, chainId]
    ),
    fetchDelegate: React.useCallback(
      (...args) => fetchDelegate(chainId, ...args),
      [fetchDelegate, chainId]
    ),
    fetchDelegates: React.useCallback(
      (...args) => fetchDelegates(chainId, ...args),
      [fetchDelegates, chainId]
    ),
    fetchAccount: React.useCallback(
      (...args) => fetchAccount(chainId, ...args),
      [fetchAccount, chainId]
    ),
    fetchNoun: React.useCallback(
      (...args) => fetchNoun(chainId, ...args),
      [fetchNoun, chainId]
    ),
    fetchNounsActivity: React.useCallback(
      (...args) => fetchNounsActivity(chainId, ...args),
      [fetchNounsActivity, chainId]
    ),
    fetchVoterActivity: React.useCallback(
      (...args) => fetchVoterActivity(chainId, ...args),
      [fetchVoterActivity, chainId]
    ),
    fetchBrowseScreenData: React.useCallback(
      (...args) => fetchBrowseScreenData(chainId, ...args),
      [fetchBrowseScreenData, chainId]
    ),
    fetchVoterScreenData: React.useCallback(
      (...args) => fetchVoterScreenData(chainId, ...args),
      [fetchVoterScreenData, chainId]
    ),
    fetchPropdatesForProposal: React.useCallback(
      (...args) => fetchPropdatesForProposal(chainId, ...args),
      [fetchPropdatesForProposal, chainId]
    ),
    addOptimitisicProposalVote,
    addOptimitisicCandidateFeedbackPost,
  };
};

export const useDelegate = (id) =>
  useStore(React.useCallback((s) => s.delegatesById[id?.toLowerCase()], [id]));

export const useDelegatesFetch = () => {
  const { fetchDelegates } = useActions();
  useFetch(() => fetchDelegates(), [fetchDelegates]);
};

export const useDelegateFetch = (id, options) => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 10_000,
  });
  const onError = useLatestCallback(options?.onError);

  const { fetchDelegate } = useActions();

  useFetch(
    id == null
      ? null
      : () =>
          fetchDelegate(id).catch((e) => {
            if (onError == null) return Promise.reject(e);
            onError(e);
          }),
    [fetchDelegate, id, onError, blockNumber]
  );
};

export const useProposalFetch = (id, options) => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 10_000,
  });
  const onError = useLatestCallback(options?.onError);

  const { fetchProposal, fetchPropdatesForProposal } = useActions();

  useFetch(
    id == null
      ? null
      : () =>
          fetchProposal(id).catch((e) => {
            if (onError == null) return Promise.reject(e);
            onError(e);
          }),
    [fetchProposal, id, onError, blockNumber]
  );

  useFetch(id == null ? null : () => fetchPropdatesForProposal(id), [
    fetchPropdatesForProposal,
    id,
  ]);
};

export const useActiveProposalsFetch = () => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 10_000,
  });
  const { fetchActiveProposals } = useActions();
  useFetch(
    blockNumber == null ? undefined : () => fetchActiveProposals(blockNumber),
    [blockNumber, fetchActiveProposals]
  );
};

export const useProposalCandidateFetch = (id, options) => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 10_000,
  });
  const onError = useLatestCallback(options?.onError);

  const { fetchProposalCandidate } = useActions();

  useFetch(
    () =>
      fetchProposalCandidate(id).catch((e) => {
        if (onError == null) return Promise.reject(e);
        onError(e);
      }),
    [fetchProposalCandidate, id, onError, blockNumber]
  );
};

export const useProposalCandidate = (id) =>
  useStore(
    React.useCallback(
      (s) => (id == null ? null : s.proposalCandidatesById[id.toLowerCase()]),
      [id]
    )
  );

const selectProposal = (
  store,
  proposalId,
  {
    state: includeState = false,
    propdates: includePropdates = false,
    blockNumber,
  } = {}
) => {
  let p = store.proposalsById[proposalId];

  if (!includeState && !includePropdates) return p ?? null;

  if (p == null) {
    if (includePropdates && store.propdatesByProposalId[proposalId] != null)
      return {
        id: proposalId,
        propdates: store.propdatesByProposalId[proposalId],
      };

    return null;
  }

  p = { ...p };

  if (includeState)
    p.state = blockNumber == null ? null : getProposalState(p, { blockNumber });

  if (includePropdates) p.propdates = store.propdatesByProposalId[proposalId];

  return p;
};

export const useProposals = ({
  state = false,
  propdates = false,
  filter,
} = {}) => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 20_000,
  });

  return useStore(
    React.useCallback(
      (s) => {
        const sort = (ps) =>
          arrayUtils.sortBy((p) => p.lastUpdatedTimestamp, ps);

        const allProposalIds = Object.keys(s.proposalsById);

        const proposals = allProposalIds.reduce((ps, id) => {
          const proposal = selectProposal(s, id, {
            state: state || filter === "active",
            propdates,
            blockNumber,
          });

          if (filter == null) {
            ps.push(proposal);
            return ps;
          }

          switch (filter) {
            case "active": {
              if (!isActiveProposalState(proposal.state)) return ps;
              ps.push(proposal);
              return ps;
            }

            default:
              throw new Error();
          }
        }, []);

        return sort(proposals);
      },
      [state, blockNumber, propdates, filter]
    )
  );
};

export const useProposal = (id, { watch = true } = {}) => {
  const { data: blockNumber } = useBlockNumber({ watch, cacheTime: 10_000 });

  return useStore(
    React.useCallback(
      (s) => {
        if (id == null) return null;

        const proposal = s.proposalsById[id];

        if (proposal == null) return null;
        if (blockNumber == null) return proposal;

        return {
          ...proposal,
          state: getProposalState(proposal, { blockNumber }),
          propdates: s.propdatesByProposalId[id],
        };
      },
      [id, blockNumber]
    )
  );
};

export const useProposalCandidates = ({
  includeCanceled = false,
  includePromoted = false,
  includeProposalUpdates = false,
} = {}) => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 30_000,
  });

  const candidatesById = useStore((s) => s.proposalCandidatesById);
  const proposalsById = useStore((s) => s.proposalsById);

  return React.useMemo(() => {
    const candidates = Object.values(candidatesById);

    const filteredCandidates = candidates.filter((c) => {
      // Filter canceled candidates
      if (c.canceledTimestamp != null) return includeCanceled;

      // Filter candidates with a matching proposal
      if (c.latestVersion?.proposalId != null) return includePromoted;

      if (c.latestVersion?.targetProposalId != null) {
        const targetProposal = proposalsById[c.latestVersion.targetProposalId];

        // Exlude candidates with a target proposal past its update period end block
        return (
          includeProposalUpdates &&
          targetProposal != null &&
          targetProposal.updatePeriodEndBlock > blockNumber
        );
      }

      return true;
    });

    return arrayUtils.sortBy(
      { value: (p) => p.lastUpdatedTimestamp, order: "desc" },
      filteredCandidates
    );
  }, [
    candidatesById,
    proposalsById,
    blockNumber,
    includeCanceled,
    includePromoted,
  ]);
};

export const useProposalUpdateCandidates = ({
                                                includeTargetProposal = false,
                                            } = {}) => {
    const { data: blockNumber } = useBlockNumber({
        watch: true,
        cacheTime: 30_000,
    });

    const candidatesById = useStore((s) => s.proposalCandidatesById);
    const proposalsById = useStore((s) => s.proposalsById);

    return React.useMemo(() => {
        const candidates = Object.values(candidatesById);

        const filteredCandidates = candidates.reduce((acc, c) => {
            if (c.latestVersion?.targetProposalId == null) return acc;

            // Exlcude canceled and submitted updates
            if (c.canceledTimestamp != null || c.latestVersion?.proposalId != null)
                return acc;

            const targetProposal = proposalsById[c.latestVersion.targetProposalId];

            // Exlude updates past its target proposal’s update period
            if (
                targetProposal == null ||
                targetProposal.updatePeriodEndBlock <= blockNumber
            )
                return acc;

            acc.push(includeTargetProposal ? { ...c, targetProposal } : c);

            return acc;
        }, []);

        return arrayUtils.sortBy(
            { value: (p) => p.lastUpdatedTimestamp, order: "desc" },
            filteredCandidates
        );
    }, [candidatesById, proposalsById, includeTargetProposal, blockNumber]);
};

export const useAccountProposals = (accountAddress) => {
  const proposalsById = useStore((s) => s.proposalsById);

  return React.useMemo(() => {
    if (accountAddress == null) return [];
    const proposals = Object.values(proposalsById);
    return proposals.filter(
      (p) => p.proposerId?.toLowerCase() === accountAddress.toLowerCase()
    );
  }, [proposalsById, accountAddress]);
};

export const useAccountSponsoredProposals = (accountAddress) => {
  const proposalsById = useStore((s) => s.proposalsById);

  return React.useMemo(() => {
    if (accountAddress == null) return [];
    const proposals = Object.values(proposalsById);
    return proposals.filter((p) =>
      p.signers?.some(
        (s) => s.id.toLowerCase() === accountAddress.toLowerCase()
      )
    );
  }, [proposalsById, accountAddress]);
};

export const useAccountProposalCandidates = (accountAddress) => {
  const candidatesById = useStore((s) => s.proposalCandidatesById);

  return React.useMemo(() => {
    if (accountAddress == null) return [];
    const candidates = Object.values(candidatesById);
    return candidates.filter(
      (c) => c.proposerId?.toLowerCase() === accountAddress.toLowerCase()
    );
  }, [candidatesById, accountAddress]);
};

export const useProposalCandidateVotingPower = (candidateId) => {
  const candidate = useProposalCandidate(candidateId);
  const proposerDelegate = useDelegate(candidate.proposerId);
  const activeProposerIds = useProposals({ filter: "active" }).map(
    (p) => p.proposerId
  );

  const proposerDelegateNounIds =
    proposerDelegate?.nounsRepresented.map((n) => n.id) ?? [];

  const validSignatures = getCandidateSponsorSignatures(candidate, {
    excludeInvalid: true,
    activeProposerIds,
  });

  const sponsoringNounIds = arrayUtils.unique(
    validSignatures.flatMap((s) => s.signer.nounsRepresented.map((n) => n.id))
  );

  const candidateVotingPower = arrayUtils.unique([
    ...sponsoringNounIds,
    ...proposerDelegateNounIds,
  ]).length;

  return candidateVotingPower;
};

export const useNoun = (id) =>
  useStore(React.useCallback((s) => s.nounsById[id], [id]));

export const useAllNounsByAccount = (accountAddress) => {
  const delegatedNouns = useStore(
    (s) => s.delegatesById[accountAddress.toLowerCase()]?.nounsRepresented ?? []
  );

  const ownedNouns = useStore(
    (s) => s.accountsById[accountAddress.toLowerCase()]?.nouns ?? []
  );

  const uniqueNouns = arrayUtils.unique(
    (n1, n2) => n1.id === n2.id,
    [...delegatedNouns, ...ownedNouns]
  );

  return arrayUtils.sortBy((n) => parseInt(n.id), uniqueNouns);
};

export const useAccount = (id) =>
  useStore(React.useCallback((s) => s.accountsById[id?.toLowerCase()], [id]));

export const useAccountFetch = (id, options) => {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    cacheTime: 10_000,
  });
  const onError = useLatestCallback(options?.onError);

  const { fetchAccount } = useActions();

  useFetch(
    id == null
      ? null
      : () =>
          fetchAccount(id).catch((e) => {
            if (onError == null) return Promise.reject(e);
            onError(e);
          }),
    [fetchAccount, id, onError, blockNumber]
  );
};

export const usePropdates = () =>
  useStore((s) => Object.values(s.propdatesByProposalId).flatMap((ps) => ps));

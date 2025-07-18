import React from "react";
import { css, keyframes } from "@emotion/react";
import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { invariant } from "@shades/common/utils";
import { useMatchMedia } from "@shades/common/react";
import Button from "@shades/ui-web/button";
import * as DropdownMenu from "@shades/ui-web/dropdown-menu";
import {
  CaretDown as CaretDownIcon,
  DotsHorizontal as DotsIcon,
  // ChatBubbles as ChatBubblesIcon,
  Document as DocumentIcon,
} from "@shades/ui-web/icons";
import { CHAIN_ID } from "@/constants/env";
import {
  getChain as getSupportedChain,
  isTestnet as isTestnetChain,
} from "@/utils/chains";
import { useAccount, useAccountStreams, useDelegate } from "@/store";
import { useNavigate } from "@/hooks/navigation";
import { useWallet, useWalletAuthentication } from "@/hooks/wallet";
import {
  useState as useSessionState,
  useActions as useSessionActions,
} from "@/session-provider";
import { useDialog } from "@/hooks/global-dialogs";
import { useConnectedFarcasterAccounts } from "@/hooks/farcaster";
import useAccountDisplayName from "@/hooks/account-display-name";
// import {
//   useAuctionData,
//   useLazySeed,
//   useNounImageDataUri,
// } from "@/components/auction-dialog";
import AccountAvatar from "@/components/account-avatar";
import LogoSymbol from "@/components/logo-symbol";
import { formatEther } from "viem";
import useTreasuryData from "@/hooks/treasury-data";
import useEnsName from "@/hooks/ens-name";

const flipAnimation = keyframes({
  "0%,52%,100%": {
    transform: "rotate3d(1,1,1,0deg)",
  },
  "2%, 50%": {
    transform: "rotate3d(0.4,1,0,180deg)",
  },
});

const Layout = ({
  scrollContainerRef,
  navigationStack = [],
  actions,
  scrollView = true,
  children,
  ...props
}) => (
  <div
    css={(t) =>
      css({
        position: "relative",
        zIndex: 0,
        flex: 1,
        minWidth: "min(30.6rem, 100vw)",
        background: t.colors.backgroundPrimary,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      })
    }
    {...props}
  >
    <NavBar navigationStack={navigationStack} actions={actions} />
    {scrollView ? (
      <div
        css={css({
          position: "relative",
          flex: 1,
          display: "flex",
          minHeight: 0,
          minWidth: 0,
        })}
      >
        <div
          ref={scrollContainerRef}
          css={css({
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: "scroll",
            overflowX: "hidden",
            minHeight: 0,
            flex: 1,
            overflowAnchor: "none",
          })}
        >
          <main
            css={css({
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              minHeight: "100%",
            })}
          >
            {children}
          </main>
        </div>
      </div>
    ) : (
      <main
        css={css({
          flex: 1,
          display: "flex",
          minHeight: 0,
          minWidth: 0,
        })}
      >
        {children}
      </main>
    )}
  </div>
);

const TreasuryDialogTrigger = React.forwardRef((props, ref) => {
  const { open: openDialog, preload: preloadDialog } = useDialog("treasury");
  const data = useTreasuryData();

  React.useEffect(() => {
    preloadDialog();
  }, [preloadDialog]);

  return (
    <Button ref={ref} {...props} onClick={() => openDialog()}>
      <span data-desktop-only>Treasury </span>
      {data == null ? (
        "..."
      ) : (
        <>
          {"Ξ"}{" "}
          {Math.round(
            parseFloat(formatEther(data.totals.eth)),
          ).toLocaleString()}
        </>
      )}
    </Button>
  );
});

// const AuctionDialogTrigger = React.forwardRef((props, ref) => {
//   const { auction } = useAuctionData();
//   const { open: openDialog, preload: preloadDialog } = useDialog("auction");
//
//   React.useEffect(() => {
//     preloadDialog();
//   }, [preloadDialog]);
//
//   return (
//     <Button
//       ref={ref}
//       {...props}
//       onClick={() => openDialog()}
//       icon={
//         <>
//           <AuctionNounImage
//             className="noun-image"
//             style={{
//               display: "block",
//               width: "2.4rem",
//               height: "2.4rem",
//               borderRadius: "0.4rem",
//             }}
//           />
//           <svg className="progress-outline" viewBox="0 0 32 32">
//             <rect width="30" height="30" rx="7" x="1" y="1" pathLength="99" />
//           </svg>
//         </>
//       }
//       css={(t) =>
//         css({
//           display: "flex",
//           marginLeft: "0.4rem",
//           marginRight: "0.8rem",
//           borderRadius: "0.6rem",
//           position: "relative",
//           overflow: "visible",
//           "&:focus-visible": {
//             boxShadow: "none",
//             ".progress-outline rect": {
//               stroke: t.colors.primary,
//             },
//           },
//           ".noun-image": {
//             background: t.colors.backgroundModifierNormal,
//           },
//           ".progress-outline": {
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             width: "calc(100% + 0.4rem)",
//             height: "calc(100% + 0.4rem)",
//             transform: "translateX(-50%) translateY(-50%)",
//             pointerEvents: "none",
//           },
//           ".progress-outline rect": {
//             fill: "none",
//             stroke: t.colors.primaryTransparentStrong,
//             strokeWidth: 2,
//             strokeDasharray:
//               "calc(var(--progress) * 100) calc((1 - var(--progress)) * 100)",
//             strokeDashoffset: "-9",
//             transition: "stroke-dashoffset 1s linear, stroke 0.1s ease-out",
//           },
//           "@media(hover: hover)": {
//             cursor: "pointer",
//             ":not([disabled]):hover": {
//               background: "none",
//               ".progress-outline rect": {
//                 stroke: t.colors.primary,
//               },
//             },
//           },
//         })
//       }
//       style={{
//         "--progress": (() => {
//           if (auction == null) return 0;
//           const now = Date.now();
//           const start = auction.startTimestamp.getTime();
//           const end = auction.endTimestamp.getTime();
//           const duration = end - start;
//           const elapsed = Math.max(0, now - start);
//           return elapsed / duration;
//         })(),
//       }}
//     />
//   );
// });

const predefinedActions = {
  "create-menu": {
    key: "create-menu",
    type: "dropdown",
    label: "New",
    placement: "bottom start",
    desktopOnly: true,
    items: [
      {
        id: "-",
        children: [
          {
            id: "new-proposal",
            title: "Proposal",
            description: "Draft a new proposal",
            icon: (
              <DocumentIcon
                aria-hidden="true"
                role="graphics-symbol"
                style={{ width: "1.6rem", height: "auto" }}
              />
            ),
          },
          // {
          //   id: "new-discussion-topic",
          //   title: "Discussion topic",
          //   description: "Start a discussion thread (onchain)",
          //   icon: (
          //     <ChatBubblesIcon
          //       style={{
          //         width: "1.6rem",
          //         height: "auto",
          //         transform: "translateY(1px)",
          //       }}
          //     />
          //   ),
          // },
        ],
      },
    ],
    buttonProps: {
      iconRight: <CaretDownIcon style={{ width: "0.9rem", height: "auto" }} />,
    },
  },
  "treasury-dialog-trigger": {
    key: "treasury-dialog-trigger",
    desktopOnly: true,
    component: TreasuryDialogTrigger,
  },
  // "auction-dialog-trigger": {
  //   key: "auction-dialog-trigger",
  //   component: AuctionDialogTrigger,
  // },
};

const resolvePredefinedAction = (actionId) => {
  invariant(
    predefinedActions[actionId] != null,
    `Unknown predefined action: ${actionId}`,
  );
  return predefinedActions[actionId];
};
const resolveAction = (action) => {
  if (typeof action !== "object") return resolvePredefinedAction(action);

  if (action.extends != null) {
    const baseAction = resolvePredefinedAction(action.extends);
    return { ...baseAction, ...action };
  }

  return action;
};

const defaultActionIds = [
  "create-menu",
  "treasury-dialog-trigger",
  // "auction-dialog-trigger",
];

const NavBar = ({ navigationStack, actions: customActions }) => {
  const unresolvedActions = customActions ?? defaultActionIds;
  const searchParams = useSearchParams();

  const { open: openTreasuryDialog } = useDialog("treasury");
  const { open: openAccountDialog } = useDialog("account");
  const { open: openEditProfileDialog } = useDialog("profile-edit");
  const { open: openProposalDraftsDialog } = useDialog("drafts");
  const { open: openDelegationDialog } = useDialog("delegation");
  const { open: openStreamsDialog } = useDialog("streams");
  const { open: openSettingsDialog } = useDialog("settings");
  const { open: openAccountAuthenticationDialog } = useDialog(
    "account-authentication",
  );
  const { open: openFarcasterSetupDialog } = useDialog("farcaster-setup");

  const isDesktop = useMatchMedia("(min-width: 600px)");

  const actions = unresolvedActions
    .map(resolveAction)
    .filter((action) => isDesktop || !action.desktopOnly);

  const pathname = usePathname();
  const navigate = useNavigate();

  const {
    address: connectedWalletAccountAddress,
    chainId: connectedChainId,
    requestAccess: requestWalletAccess,
    disconnect: disconnectWallet,
    switchToTargetChain: switchWalletToTargetChain,
    isAuthenticated: isConnectedWalletAccountAuthenticated,
    isLoading: isLoadingWallet,
  } = useWallet();
  const ensName = useEnsName(connectedWalletAccountAddress);
  const { signIn: signInConnectedWalletAccount } = useWalletAuthentication();
  const { address: loggedInAccountAddress } = useSessionState();
  const { destroy: signOut } = useSessionActions();
  const connectedFarcasterAccounts = useConnectedFarcasterAccounts();
  const hasVerifiedFarcasterAccount = connectedFarcasterAccounts?.length > 0;
  const hasFarcasterAccountKey =
    hasVerifiedFarcasterAccount &&
    connectedFarcasterAccounts.some((a) => a.hasAccountKey);

  const userAccountAddress =
    connectedWalletAccountAddress ?? loggedInAccountAddress;

  const isTestnet = isTestnetChain(CHAIN_ID);
  const isConnectedToTargetChain = CHAIN_ID === connectedChainId;

  const chain = getSupportedChain(CHAIN_ID);

  const userAccount = useAccount(userAccountAddress);
  const userDelegate = useDelegate(userAccountAddress);

  const hasNouns = userAccount?.nouns?.length > 0;
  const hasVotingPower = userDelegate?.nounsRepresented?.length > 0;

  const userAccountDisplayName = useAccountDisplayName(userAccountAddress);

  const hasStreams =
    useAccountStreams(connectedWalletAccountAddress).length > 0;

  const handleDropDownAction = async (key) => {
    switch (key) {
      case "new-proposal":
        navigate("/new");
        break;
      // case "new-discussion-topic":
      //   navigate("/new?topic=1");
      //   break;
      case "open-account-dialog":
        openAccountDialog();
        break;
      case "open-drafts-dialog":
        openProposalDraftsDialog();
        break;
      case "open-edit-profile-dialog":
        openEditProfileDialog();
        break;
      case "open-delegation-dialog":
        openDelegationDialog();
        break;
      case "open-streams-dialog":
        openStreamsDialog();
        break;
      case "copy-account-address":
        navigator.clipboard.writeText(userAccountAddress);
        break;
      case "open-warpcast":
        window.open("https://warpcast.com/~/channel/lil-nouns", "_blank");
        break;
      case "open-flows":
        window.open("https://flows.wtf", "_blank");
        break;
      case "open-camp-changelog":
        window.open("https://warpcast.com/~/channel/lilnouns", "_blank");
        break;
      // case "open-camp-discord":
      //   window.open("https://discord.gg/EvAzqBTF8x", "_blank");
      //   break;
      case "open-camp-github":
        window.open("https://github.com/lilnouns/lilnouns-camp", "_blank");
        break;
      // case "navigate-to-auction":
      //   navigate("/auction");
      //   break;
      case "navigate-to-proposal-listing":
        navigate("/proposals");
        break;
      case "navigate-to-candidate-listing":
        navigate("/candidates");
        break;
      case "navigate-to-topic-listing":
        navigate("/topics");
        break;
      case "navigate-to-account-listing":
        navigate("/voters");
        break;
      case "open-settings-dialog":
        openSettingsDialog();
        break;
      case "open-treasury-dialog":
        openTreasuryDialog();
        break;
      case "setup-farcaster":
        openFarcasterSetupDialog();
        break;
      case "sign-in": {
        try {
          openAccountAuthenticationDialog();
          await signInConnectedWalletAccount();
          // TODO alert success
        } catch (e) {
          console.error(e);
          alert("Ops, seems like something went wrong!");
        }
        break;
      }
      case "sign-out": {
        try {
          await signOut();
          alert("You have been logged out");
        } catch (e) {
          console.error(e);
          alert("Ops, seems like something went wrong!");
        }
        break;
      }
      case "disconnect-wallet":
        disconnectWallet();
        break;
    }
  };

  return (
    <nav
      css={(t) =>
        css({
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          whiteSpace: "nowrap",
          minHeight: t.navBarHeight, // "4.7rem",
          "@media (max-width: 599px)": {
            '[data-desktop-only="true"]': {
              display: "none",
            },
          },
        })
      }
    >
      <div
        css={css({
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.2rem",
          overflow: "hidden",
          padding: "1rem 1.6rem 1rem 1.3rem",
          "@media (min-width: 600px)": {
            padding: "1rem",
          },
        })}
      >
        {[
          (() => {
            const logo = (
              <LogoSymbol
                css={css({
                  display: "inline-block",
                  width: "1.8rem",
                  height: "auto",
                  backfaceVisibility: "hidden",
                })}
                style={{
                  filter: isTestnet ? "invert(1)" : undefined,
                }}
              />
            );

            if (pathname !== "/")
              return {
                to: "/",
                label: (
                  <>
                    {logo}
                    <span
                      css={css({
                        display: "none",
                        "@media(min-width: 600px)": {
                          display: "inline",
                          marginLeft: "0.6rem",
                        },
                      })}
                    >
                      {isTestnet ? chain.name : "Camp"}
                    </span>
                  </>
                ),
              };

            // Different behavior based on current location
            const isRoot = pathname === "/";
            // Check if there are any search parameters
            const hasSearchParams = searchParams.size > 0;

            return {
              key: "root-logo",
              to: "/",
              // Use replace prop when on root with search params to not add to history stack
              replace: hasSearchParams && isRoot ? true : undefined,
              props: {
                style: {
                  height: "2.8rem",
                  minWidth: "2.8rem",
                  paddingBlock: 0,
                  perspective: "200vmax",
                },
              },
              label: (
                <>
                  <div
                    css={css({
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      width: "1.8rem",
                      height: "1.8rem",
                      animation: `${flipAnimation} 24s linear 12s infinite`,
                      transition: "0.25s transform ease-out",
                      transformStyle: "preserve-3d",
                      svg: { display: "block" },
                      "@media(hover: hover)": {
                        "&:hover": {
                          animation: "none",
                        },
                      },
                    })}
                  >
                    {logo}
                    <div
                      css={css({
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        backfaceVisibility: "hidden",
                        transform:
                          "translateX(-50%) translateY(-50%) rotate3d(0.4,1,0,180deg)",
                        width: "2.4rem",
                        height: "2.4rem",
                        svg: {
                          display: "block",
                          width: "100%",
                          height: "100%",
                          borderRadius: "0.3rem",
                        },
                      })}
                    >
                      <NoggleImage />
                    </div>
                  </div>
                  {isTestnet && (
                    <span
                      css={css({
                        display: "none",
                        "@media(min-width: 600px)": {
                          display: "inline",
                          marginLeft: "0.6rem",
                        },
                      })}
                    >
                      {chain.name}
                    </span>
                  )}
                </>
              ),
            };
          })(),
          ...navigationStack,
        ].map((item, index) => {
          const [Component, componentProps] =
            item.component != null
              ? [item.component, item.props]
              : [
                  NextLink,
                  {
                    prefetch: true,
                    href: item.to,
                  },
                ];
          return (
            <React.Fragment key={item.key ?? item.to}>
              {index > 0 && (
                <span
                  data-index={index}
                  data-desktop-only={item.desktopOnly}
                  css={(t) =>
                    css({
                      color: t.colors.textMuted,
                      fontSize: t.text.sizes.base,
                    })
                  }
                >
                  {"/"}
                </span>
              )}
              <Component
                {...componentProps}
                data-index={index}
                data-image={item.image || undefined}
                // data-disabled={pathname === item.to}
                data-desktop-only={item.desktopOnly}
                css={(t) =>
                  css({
                    display: "inline-block",
                    height: "2.8rem",
                    minWidth: "2.8rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: t.fontSizes.base,
                    color: t.colors.textNormal,
                    padding: "0.3rem 0.5rem",
                    borderRadius: "0.6rem",
                    textDecoration: "none",
                    '&[data-index="0"]': {
                      display: "inline-flex",
                      alignItems: "center",
                      minWidth: "max-content",
                    },
                    '&[data-disabled="true"]': { pointerEvents: "none" },
                    "@media(hover: hover)": {
                      cursor: "pointer",
                      ":hover": {
                        background: t.colors.backgroundModifierHover,
                      },
                    },
                  })
                }
              >
                {item.label}
              </Component>
            </React.Fragment>
          );
        })}
      </div>
      <div
        css={(t) =>
          css({
            fontSize: t.text.sizes.base,
            padding: "0 1.6rem 0 0",
            ul: {
              display: "grid",
              gridAutoFlow: "column",
              gridGap: "0.3rem",
              alignItems: "center",
            },
            li: { listStyle: "none" },
            '[role="separator"]': {
              width: "0.1rem",
              background: t.colors.borderLight,
              height: "1.6rem",
              margin: "0 0.4rem",
            },
            "@media (min-width: 600px)": {
              padding: "0 1rem",
            },
          })
        }
      >
        <ul>
          {[
            ...actions,
            actions.length > 0 && { type: "separator" },
            connectedWalletAccountAddress == null
              ? {
                  onSelect: () => {
                    requestWalletAccess();
                  },
                  buttonProps: {
                    variant: "default",
                    isLoading: requestWalletAccess == null || isLoadingWallet,
                    disabled: requestWalletAccess == null || isLoadingWallet,
                    style: { marginLeft: "0.8rem", marginRight: "0.4rem" },
                  },
                  label: (
                    <>
                      Connect<span data-desktop-only> Wallet</span>
                    </>
                  ),
                }
              : !isConnectedToTargetChain
                ? {
                    onSelect: () => {
                      switchWalletToTargetChain();
                    },
                    buttonProps: {
                      variant: "default",
                      isLoading: isLoadingWallet,
                      disabled:
                        switchWalletToTargetChain == null || isLoadingWallet,
                      style: { marginLeft: "0.8rem" },
                    },
                    label: `Switch to ${CHAIN_ID === 1 ? "Mainnet" : chain.name}`,
                  }
                : null,
            (() => {
              const daoSection = {
                id: "dao",
                title: "DAO",
                children: [
                  // { id: "navigate-to-auction", title: "Auction" },
                  { id: "navigate-to-proposal-listing", title: "Proposals" },
                  {
                    id: "navigate-to-candidate-listing",
                    title: "Candidates",
                  },
                  // {
                  //   id: "navigate-to-topic-listing",
                  //   title: "Discussion topics",
                  // },
                  { id: "navigate-to-account-listing", title: "Voters" },
                  { id: "open-treasury-dialog", title: "Treasury" },
                ],
              };
              const externalSection = {
                id: "external",
                title: "External",
                children: [
                  {
                    id: "open-warpcast",
                    title: "Farcaster",
                    iconRight: <span>{"\u2197"}</span>,
                  },
                  // {
                  //   id: "open-flows",
                  //   title: "Flows",
                  //   iconRight: <span>{"\u2197"}</span>,
                  // },
                ],
              };
              const settingsSection = {
                id: "settings",
                title: "Camp",
                children: [
                  { id: "open-settings-dialog", title: "Settings" },
                  {
                    id: "open-camp-changelog",
                    title: "Changelog",
                    iconRight: <span>{"\u2197"}</span>,
                  },
                  // {
                  //   id: "open-camp-discord",
                  //   title: "Discord",
                  //   iconRight: <span>{"\u2197"}</span>,
                  // },
                  {
                    id: "open-camp-github",
                    title: "GitHub",
                    iconRight: <span>{"\u2197"}</span>,
                  },
                ],
              };

              if (connectedWalletAccountAddress == null)
                return {
                  type: "dropdown",
                  items: [
                    daoSection,
                    externalSection,
                    settingsSection,
                    loggedInAccountAddress != null && {
                      id: "disconnect",
                      children: [{ id: "sign-out", title: "Log out" }],
                    },
                  ].filter(Boolean),
                  buttonProps: {
                    style: { display: "flex" },
                    icon: (
                      <DotsIcon style={{ width: "1.8rem", height: "auto" }} />
                    ),
                  },
                };

              return {
                type: "dropdown",
                items: [
                  {
                    id: "connected-account",
                    title: "You",
                    children: [
                      {
                        id: "open-account-dialog",
                        title: "Account",
                      },
                      ensName != null && {
                        id: "open-edit-profile-dialog",
                        title: "Edit profile",
                      },
                      (hasNouns || hasVotingPower) && {
                        id: "open-delegation-dialog",
                        title: "Manage delegation",
                      },
                      hasStreams && {
                        id: "open-streams-dialog",
                        title: "Streams",
                      },
                      {
                        id: "open-drafts-dialog",
                        title: "Proposal drafts",
                      },
                      !hasVerifiedFarcasterAccount
                        ? null
                        : !hasFarcasterAccountKey
                          ? {
                              id: "setup-farcaster",
                              title: "Setup Farcaster",
                            }
                          : !isConnectedWalletAccountAuthenticated
                            ? {
                                id: "sign-in",
                                title: "Authenticate account",
                              }
                            : null,
                    ].filter(Boolean),
                  },
                  daoSection,
                  externalSection,
                  settingsSection,
                  {
                    id: "disconnect",
                    children: [
                      loggedInAccountAddress != null && {
                        id: "sign-out",
                        title: "Log out",
                      },
                      connectedWalletAccountAddress != null && {
                        id: "disconnect-wallet",
                        title: "Disconnect wallet",
                      },
                    ].filter(Boolean),
                  },
                ],
                buttonProps: {
                  css: css({
                    display: "flex",
                    "@media(max-width: 600px)": {
                      paddingInline: "0.4rem",
                      marginLeft: "0.3rem",
                      ".account-display-name": { display: "none" },
                    },
                  }),
                  iconRight: (
                    <CaretDownIcon
                      style={{ width: "0.9rem", height: "auto" }}
                    />
                  ),
                },
                label: (
                  <div
                    css={css({
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                    })}
                  >
                    {pathname === "/" && (
                      <div className="account-display-name">
                        {userAccountDisplayName}
                      </div>
                    )}
                    <AccountAvatar address={userAccountAddress} size="2rem" />
                  </div>
                ),
              };
            })(),
          ]
            .filter(Boolean)
            .map((a, i) => {
              if (a.type === "separator")
                return (
                  <li key={i} role="separator" aria-orientation="vertical" />
                );

              const [ButtonComponent, buttonProps] = [
                a.component ?? Button,
                {
                  variant: a.buttonVariant ?? "transparent",
                  size: "small",
                  children: a.label,
                  ...a.buttonProps,
                },
              ];

              return (
                <li key={a.key ?? i} data-desktop-only={a.desktopOnly}>
                  {a.type === "dropdown" ? (
                    <DropdownMenu.Root placement={a.placement ?? "bottom"}>
                      <DropdownMenu.Trigger asChild>
                        <ButtonComponent {...buttonProps} />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content
                        css={css({
                          width: "min-content",
                          minWidth: "min-content",
                          maxWidth: "calc(100vw - 2rem)",
                        })}
                        items={a.items}
                        onAction={handleDropDownAction}
                      >
                        {(item) => (
                          <DropdownMenu.Section
                            title={item.title}
                            items={item.children}
                          >
                            {(item) => <DropdownMenu.Item {...item} />}
                          </DropdownMenu.Section>
                        )}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  ) : (
                    <ButtonComponent {...buttonProps} onClick={a.onSelect} />
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </nav>
  );
};

export const MainContentContainer = ({
  sidebar = null,
  narrow = false,
  containerHeight,
  sidebarWidth,
  sidebarGap,
  pad = true,
  children,
  ...props
}) => (
  <div
    data-pad={pad && undefined}
    css={css({
      "@media (min-width: 600px)": {
        margin: "0 auto",
        maxWidth: "100%",
        width: "var(--width)",
        padding: "0 4rem",
      },
      "@media (min-width: 1152px)": {
        padding: "0 8rem",
      },
      '&[data-pad="false"]': { padding: 0 },
    })}
    style={{
      "--width": narrow ? "92rem" : "134rem",
    }}
    {...props}
  >
    {sidebar == null ? (
      children
    ) : (
      <div
        css={(t) =>
          css({
            "@media (min-width: 1152px)": {
              display: "grid",
              gridTemplateColumns: `minmax(0, 1fr) var(--sidebar-width, ${t.sidebarWidth})`,
              gridGap: "var(--sidebar-gap, 10rem)",
              "[data-sidebar-content]": {
                position: "sticky",
                top: 0,
                maxHeight: `var(--container-height, calc(100vh - ${t.navBarHeight}))`,
                overflow: "auto",
                // Prevents the scrollbar from overlapping the content
                margin: "0 -2rem",
                padding: "0 2rem",
              },
            },
          })
        }
        style={{
          "--container-height": containerHeight,
          "--sidebar-width": sidebarWidth,
          "--sidebar-gap": sidebarGap,
        }}
      >
        <div>{children}</div>
        <div>
          <div data-sidebar-content>{sidebar}</div>
        </div>
      </div>
    )}
  </div>
);

// const AuctionNounImage = (props) => {
//   const { auction } = useAuctionData();
//   const seed = useLazySeed(auction?.nounId);
//   const imageDataUri = useNounImageDataUri(seed);
//   if (imageDataUri == null) return <div {...props} />;
//   return <img src={imageDataUri} {...props} />;
// };

const NoggleImage = () => (
  <svg
    fill="none"
    width="160"
    height="60"
    shapeRendering="crispEdges"
    viewBox="0 0 160 60"
  >
    <g fill="#d53c5e">
      <path d="m90 0h-60v10h60z" />
      <path d="m160 0h-60v10h60z" />
      <path d="m40 10h-10v10h10z" />
    </g>
    <path d="m60 10h-20v10h20z" fill="#fff" />
    <path d="m80 10h-20v10h20z" fill="#000" />
    <path d="m90 10h-10v10h10z" fill="#d53c5e" />
    <path d="m110 10h-10v10h10z" fill="#d53c5e" />
    <path d="m130 10h-20v10h20z" fill="#fff" />
    <path d="m150 10h-20v10h20z" fill="#000" />
    <path d="m160 10h-10v10h10z" fill="#d53c5e" />
    <path d="m40 20h-40v10h40z" fill="#d53c5e" />
    <path d="m60 20h-20v10h20z" fill="#fff" />
    <path d="m80 20h-20v10h20z" fill="#000" />
    <path d="m110 20h-30v10h30z" fill="#d53c5e" />
    <path d="m130 20h-20v10h20z" fill="#fff" />
    <path d="m150 20h-20v10h20z" fill="#000" />
    <path d="m160 20h-10v10h10z" fill="#d53c5e" />
    <path d="m10 30h-10v10h10z" fill="#d53c5e" />
    <path d="m40 30h-10v10h10z" fill="#d53c5e" />
    <path d="m60 30h-20v10h20z" fill="#fff" />
    <path d="m80 30h-20v10h20z" fill="#000" />
    <path d="m90 30h-10v10h10z" fill="#d53c5e" />
    <path d="m110 30h-10v10h10z" fill="#d53c5e" />
    <path d="m130 30h-20v10h20z" fill="#fff" />
    <path d="m150 30h-20v10h20z" fill="#000" />
    <path d="m160 30h-10v10h10z" fill="#d53c5e" />
    <path d="m10 40h-10v10h10z" fill="#d53c5e" />
    <path d="m40 40h-10v10h10z" fill="#d53c5e" />
    <path d="m60 40h-20v10h20z" fill="#fff" />
    <path d="m80 40h-20v10h20z" fill="#000" />
    <path d="m90 40h-10v10h10z" fill="#d53c5e" />
    <path d="m110 40h-10v10h10z" fill="#d53c5e" />
    <path d="m130 40h-20v10h20z" fill="#fff" />
    <path d="m150 40h-20v10h20z" fill="#000" />
    <path d="m160 40h-10v10h10z" fill="#d53c5e" />
    <path d="m90 50h-60v10h60z" fill="#d53c5e" />
    <path d="m160 50h-60v10h60z" fill="#d53c5e" />
  </svg>
);

export default Layout;

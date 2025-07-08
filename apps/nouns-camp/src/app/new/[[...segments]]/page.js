"use client";

import { useWallet } from "@/hooks/wallet";
import ClientAppProvider from "@/app/client-app-provider";
import ProposalOrTopicEditorScreen from "@/components/proposal-or-topic-editor-screen";
import ConnectWalletScreen from "@/components/connect-wallet-screen";

// export const runtime = "edge";

export default function Page({ params }) {
  const draftId = params.segments?.[0];
  return (
    <ClientAppProvider>
      <RequireConnectedAccount>
        <ProposalOrTopicEditorScreen draftId={draftId} />
      </RequireConnectedAccount>
    </ClientAppProvider>
  );
}

const RequireConnectedAccount = ({ children }) => {
  const { address: connectedAccountAddress } = useWallet();

  if (connectedAccountAddress == null) return <ConnectWalletScreen />;

  return children;
};

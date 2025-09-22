"use client";
import React, { use, useEffect } from "react";

import { useWallet } from "@/hooks/wallet";
import ClientAppProvider from "@/app/client-app-provider";
import ProposalOrTopicEditorScreen from "@/components/proposal-or-topic-editor-screen";
import ConnectWalletScreen from "@/components/connect-wallet-screen";
import { useCollection as useDrafts } from "@/hooks/drafts";
import { useDialog } from "@/hooks/global-dialogs";
import { useNavigate, useSearchParams } from "@/hooks/navigation";

export default function Page(props) {
  const params = use(props.params);
  const draftId = params.segments?.[0];
  return (
    <ClientAppProvider>
      <RequireConnectedAccount>
        <PageContent draftId={draftId} />
      </RequireConnectedAccount>
    </ClientAppProvider>
  );
}

const PageContent = ({ draftId }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { createItem: createDraft } = useDrafts();

  const { open: openTemplateDialog, isOpen: isTemplateDialogOpen } =
    useDialog("proposal-templates");

  const hasTopicParam = searchParams.get("topic") != null;

  useEffect(() => {
    if (draftId == null && hasTopicParam) {
      const draft = createDraft({ actions: null });
      navigate(`/new/${draft.id}`, { replace: true });
      return;
    }

    if (draftId == null) openTemplateDialog();
  }, [draftId, hasTopicParam, createDraft, navigate, openTemplateDialog]);

  useEffect(() => {
    if (draftId == null && !isTemplateDialogOpen && !hasTopicParam) {
      navigate("/", { replace: true });
    }
  }, [draftId, hasTopicParam, isTemplateDialogOpen, navigate]);

  if (draftId == null) return null;

  return <ProposalOrTopicEditorScreen draftId={draftId} />;
};

const RequireConnectedAccount = ({ children }) => {
  const { address: connectedAccountAddress } = useWallet();

  if (connectedAccountAddress == null) return <ConnectWalletScreen />;

  return children;
};

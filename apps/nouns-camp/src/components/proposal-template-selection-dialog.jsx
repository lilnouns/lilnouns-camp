import React from "react";
import { css, useTheme } from "@emotion/react";
import { markdown as markdownUtils } from "@shades/common/utils";
import Dialog from "@shades/ui-web/dialog";
import DialogHeader from "@shades/ui-web/dialog-header";

import { fromMessageBlocks as messageToRichTextBlocks } from "@/components/rich-text-editor";
import { proposalTemplates } from "@/data/proposal-templates";
import { useCollection as useDrafts } from "@/hooks/drafts";
import { useNavigate } from "@/hooks/navigation";

const ProposalTemplateSelectionDialog = ({ isOpen, close }) => {
  return (
    <Dialog isOpen={isOpen} onRequestClose={close} width="40rem">
      {(props) => <Content dismiss={close} {...props} />}
    </Dialog>
  );
};

const Content = ({ titleProps, dismiss }) => {
  const { createItem: createDraft } = useDrafts();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSelect = React.useCallback(
    (defaults) => {
      const body =
        typeof defaults.body === "string"
          ? messageToRichTextBlocks(
              markdownUtils.toMessageBlocks(defaults.body),
            )
          : defaults.body;
      const draft = createDraft({ ...defaults, body });
      dismiss();
      navigate(`/new/${draft.id}`);
    },
    [createDraft, navigate, dismiss],
  );

  return (
    <div
      css={css({
        padding: "1.6rem",
        "@media (min-width: 600px)": { padding: "2rem" },
      })}
    >
      <DialogHeader
        title="Select a template"
        titleProps={titleProps}
        dismiss={dismiss}
      />
      <main>
        <ul
          css={css({
            listStyle: "none",
            padding: 0,
            marginTop: "1.5rem",
            display: "grid",
            gap: "1rem",
          })}
        >
          {proposalTemplates.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => handleSelect(t.defaults)}
                aria-label={t.name}
                css={css({
                  width: "100%",
                  textAlign: "left",
                  padding: "1rem",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 6,
                  background: theme.colors.backgroundSecondary,
                  color: theme.colors.textNormal,
                  "@media(hover: hover)": {
                    ":hover": {
                      background: theme.colors.backgroundModifierHover,
                    },
                  },
                })}
              >
                <strong>{t.name}</strong>
                <div css={css({ marginTop: "0.25rem", opacity: 0.8 })}>
                  {t.description}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default ProposalTemplateSelectionDialog;

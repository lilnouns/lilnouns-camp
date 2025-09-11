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
    <Dialog isOpen={isOpen} onRequestClose={close} width="54rem">
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
          css={(t) =>
            css({
              listStyle: "none",
              padding: 0,
              marginTop: "1.5rem",
              display: "grid",
              gap: "1rem",
              // Mimic sectioned-list hover treatment
              "@media(hover: hover)": {
                "button": { cursor: "pointer" },
                "button:hover": {
                  background: `linear-gradient(90deg, transparent 0%, ${t.colors.backgroundModifierNormal} 20%, ${t.colors.backgroundModifierNormal} 80%, transparent 100%)`,
                },
              },
            })
          }
        >
          {proposalTemplates.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => handleSelect(t.defaults)}
                aria-label={t.name}
                css={(t) =>
                  css({
                    width: "100%",
                    textAlign: "left",
                    padding: "0.8rem 0", // align with drafts list items
                    border: 0,
                    background: "transparent",
                    color: t.colors.textNormal,
                  })
                }
              >
                <div
                  css={(t) =>
                    css({
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    })
                  }
                >
                  <div
                    css={(t) =>
                      css({
                        fontWeight: t.text.weights.smallHeader,
                        lineHeight: 1.3,
                      })
                    }
                    className="title"
                  >
                    {t.name}
                  </div>
                  <div
                    css={(t) =>
                      css({
                        fontSize: t.text.sizes.small,
                        color: t.colors.textDimmed,
                      })
                    }
                  >
                    {t.description}
                  </div>
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

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/test-utils";

import ProposalTemplateSelectionDialog from "@/components/proposal-template-selection-dialog";
import { proposalTemplates } from "@/data/proposal-templates";

const createDraftMock = vi.fn(() => ({ id: "1" }));
const navigateMock = vi.fn();
const closeMock = vi.fn();

vi.mock("@/hooks/drafts", () => ({
  useCollection: () => ({ createItem: createDraftMock }),
}));

vi.mock("@/hooks/navigation", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@shades/ui-web/dialog", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div>{typeof children === "function" ? children({}) : children}</div>
  ),
}));

vi.mock("@shades/ui-web/dialog-header", () => ({
  __esModule: true,
  default: ({ title, dismiss }) => (
    <div>
      <span>{title}</span>
      <button onClick={dismiss}>close</button>
    </div>
  ),
}));

vi.mock("@/components/rich-text-editor", () => ({
  fromMessageBlocks: (blocks) => blocks,
}));

describe("ProposalTemplateSelectionDialog", () => {
  it("creates draft with defaults and navigates", () => {
    renderWithProviders(
      <ProposalTemplateSelectionDialog isOpen close={closeMock} />,
    );
    const button = screen.getByRole("button", {
      name: proposalTemplates[0].name,
    });
    fireEvent.click(button);
    expect(createDraftMock).toHaveBeenCalled();
    const arg = createDraftMock.mock.calls[0][0];
    expect(arg.name).toBe(proposalTemplates[0].defaults.name);
    expect(Array.isArray(arg.body)).toBe(true);
    expect(closeMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(`/new/1`);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteDeadlineButton from "@/components/dashboard/DeleteDeadlineButton";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockEq = vi.fn();
const mockDelete = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ delete: mockDelete }),
  }),
}));

describe("DeleteDeadlineButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  it("renders initial Delete button", () => {
    render(<DeleteDeadlineButton deadlineId="dl-1" />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeDefined();
  });

  it("shows confirmation UI after clicking Delete", () => {
    render(<DeleteDeadlineButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(screen.getByText(/delete this deadline/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /yes, delete/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
  });

  it("returns to initial state when Cancel is clicked", () => {
    render(<DeleteDeadlineButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeDefined();
  });

  it("navigates to /deadlines on successful delete", async () => {
    mockEq.mockResolvedValue({ error: null });

    render(<DeleteDeadlineButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/deadlines");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message on failed delete", async () => {
    mockEq.mockResolvedValue({ error: { message: "DB error" } });

    render(<DeleteDeadlineButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to delete/i)).toBeDefined();
    });
  });

  it("disables yes-delete button while loading", async () => {
    mockEq.mockImplementation(() => new Promise(() => {}));

    render(<DeleteDeadlineButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /deleting/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });
});

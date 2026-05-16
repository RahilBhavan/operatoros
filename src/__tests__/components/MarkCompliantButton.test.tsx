import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MarkCompliantButton from "@/components/dashboard/MarkCompliantButton";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockEq = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ update: mockUpdate }),
  }),
}));

describe("MarkCompliantButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it("renders the Mark as Compliant button", () => {
    render(<MarkCompliantButton deadlineId="dl-1" />);
    expect(screen.getByRole("button", { name: /mark compliant/i })).toBeDefined();
  });

  it("calls supabase update and refreshes on success", async () => {
    mockEq.mockResolvedValue({ error: null });

    render(<MarkCompliantButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /mark compliant/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ status: "compliant" });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message on failure", async () => {
    mockEq.mockResolvedValue({ error: { message: "DB error" } });

    render(<MarkCompliantButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /mark compliant/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeDefined();
    });
  });

  it("disables button while loading", async () => {
    mockEq.mockImplementation(() => new Promise(() => {}));

    render(<MarkCompliantButton deadlineId="dl-1" />);
    fireEvent.click(screen.getByRole("button", { name: /mark compliant/i }));

    await waitFor(() => {
      const btn = screen.getByRole("button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toMatch(/marking/i);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CorrectionReviewActions from "@/components/admin/CorrectionReviewActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("CorrectionReviewActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders accept + reject buttons by default", () => {
    render(<CorrectionReviewActions correctionId="abc" />);
    expect(screen.getByRole("button", { name: /accept/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDefined();
  });

  it("requires confirmation before posting accept", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<CorrectionReviewActions correctionId="abc" />);
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    // Two-step: first click reveals the confirm UI; no fetch yet.
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/confirm accept/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /confirm accept/i }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/admin/corrections/abc/accept");
  });

  it("maps a 409 from the API (correction_already_resolved) to a user message", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Correction already resolved. Reload to see its status." }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<CorrectionReviewActions correctionId="abc" />);
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm accept/i }));
    await waitFor(() => {
      expect(screen.getByText(/already resolved/i)).toBeDefined();
    });
  });

  it("blocks reject when reviewer note is empty", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<CorrectionReviewActions correctionId="abc" />);
    fireEvent.click(screen.getByRole("button", { name: /^reject$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm reject/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/reviewer note is required/i)).toBeDefined();
  });

  it("sends the review note when present", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<CorrectionReviewActions correctionId="abc" />);
    fireEvent.click(screen.getByRole("button", { name: /^reject$/i }));
    const note = screen.getByRole("textbox");
    fireEvent.change(note, { target: { value: "Not enough evidence from a primary source." } });
    fireEvent.click(screen.getByRole("button", { name: /confirm reject/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.review_note).toBe("Not enough evidence from a primary source.");
  });
});

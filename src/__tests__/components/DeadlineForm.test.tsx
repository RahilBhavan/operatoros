import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeadlineForm from "@/components/dashboard/DeadlineForm";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: mockBack }),
}));

const mockSingle = vi.fn();
const mockChain = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: mockSingle,
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: () => mockChain }),
}));

describe("DeadlineForm (create mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockChain, {
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
  });

  it("renders the name input and Add Deadline button", () => {
    render(<DeadlineForm businessId="biz-123" />);
    expect(screen.getByPlaceholderText(/Illinois LLC Annual Report/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /add deadline/i })).toBeDefined();
  });

  it("submit button is disabled when name and date are empty", () => {
    render(<DeadlineForm businessId="biz-123" />);
    const submitBtn = screen.getByRole("button", { name: /add deadline/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it("submit button remains disabled if only name is filled (no date)", async () => {
    render(<DeadlineForm businessId="biz-123" />);
    const nameInput = screen.getByPlaceholderText(/Illinois LLC Annual Report/i);
    await userEvent.type(nameInput, "My Deadline");
    const submitBtn = screen.getByRole("button", { name: /add deadline/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it("shows error message on failed insert", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });
    Object.assign(mockChain, {
      insert: vi.fn().mockReturnValue(mockChain),
      select: vi.fn().mockReturnValue(mockChain),
      single: mockSingle,
    });

    render(<DeadlineForm businessId="biz-123" />);

    const nameInput = screen.getByPlaceholderText(/Illinois LLC Annual Report/i);
    await userEvent.type(nameInput, "Test Deadline");

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2027-06-15" } });

    fireEvent.click(screen.getByRole("button", { name: /add deadline/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to save deadline/i)).toBeDefined();
    });
  });

  it("navigates to deadline detail on successful insert", async () => {
    mockSingle.mockResolvedValue({ data: { id: "new-id" }, error: null });
    Object.assign(mockChain, {
      insert: vi.fn().mockReturnValue(mockChain),
      select: vi.fn().mockReturnValue(mockChain),
      single: mockSingle,
    });

    render(<DeadlineForm businessId="biz-123" />);

    const nameInput = screen.getByPlaceholderText(/Illinois LLC Annual Report/i);
    await userEvent.type(nameInput, "Test Deadline");

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2027-06-15" } });

    fireEvent.click(screen.getByRole("button", { name: /add deadline/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/deadlines/new-id");
    });
  });
});

describe("DeadlineForm (edit mode)", () => {
  const existing = {
    id: "deadline-abc",
    business_id: "biz-123",
    name: "Annual Report",
    description: "File with Secretary of State",
    deadline_type: "entity_filing" as const,
    governing_agency: "IL SoS",
    frequency: "annual" as const,
    due_date: "2026-12-01",
    status: "upcoming" as const,
    source: "user_manual" as const,
    location_id: null,
    assigned_to: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    severity_tier: "medium" as const,
    penalty_estimate_cents: null,
    source_url: null,
    statute_citation: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills name from existing deadline", () => {
    render(<DeadlineForm businessId="biz-123" existing={existing} />);
    const nameInput = screen.getByPlaceholderText(/Illinois LLC Annual Report/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Annual Report");
  });

  it("shows Save Changes button in edit mode", () => {
    render(<DeadlineForm businessId="biz-123" existing={existing} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDefined();
  });

  it("shows status select in edit mode", () => {
    render(<DeadlineForm businessId="biz-123" existing={existing} />);
    const selects = document.querySelectorAll("select");
    // type, frequency, and status selects
    expect(selects.length).toBe(3);
  });

  it("redirects to deadline detail on successful update", async () => {
    mockChain.eq = vi.fn().mockResolvedValue({ error: null });
    mockChain.update = vi.fn().mockReturnValue(mockChain);

    render(<DeadlineForm businessId="biz-123" existing={existing} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/deadlines/deadline-abc");
    });
  });
});

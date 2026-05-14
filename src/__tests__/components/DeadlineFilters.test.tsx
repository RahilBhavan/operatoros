import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ toString: () => "" }),
}));

describe("DeadlineFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all status filter buttons", () => {
    render(<DeadlineFilters />);
    expect(screen.getByRole("button", { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /overdue/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /due soon/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /upcoming/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /compliant/i })).toBeDefined();
  });

  it("renders type select with All Types as first option", () => {
    render(<DeadlineFilters />);
    const select = document.querySelector("select") as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.options[0].text).toBe("All Types");
  });

  it("navigates with status param when a status button is clicked", () => {
    render(<DeadlineFilters />);
    fireEvent.click(screen.getByRole("button", { name: /overdue/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("status=overdue"));
  });

  it("navigates without status param when All is clicked", () => {
    render(<DeadlineFilters currentStatus="overdue" />);
    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
    const calledWith: string = mockPush.mock.calls[0][0];
    expect(calledWith).not.toContain("status=");
  });

  it("navigates with type param when select changes", () => {
    render(<DeadlineFilters />);
    const select = document.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "tax" } });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("type=tax"));
  });

  it("highlights the active status button", () => {
    render(<DeadlineFilters currentStatus="overdue" />);
    const overdueBtn = screen.getByRole("button", { name: /overdue/i });
    expect(overdueBtn.className).toContain("bg-blue-600");
  });
});

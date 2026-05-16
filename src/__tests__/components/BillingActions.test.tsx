import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BillingActions from "@/components/dashboard/BillingActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("BillingActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when no plan and no customer", () => {
    const { container } = render(<BillingActions hasCustomer={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders portal button when hasCustomer and no plan", () => {
    render(<BillingActions hasCustomer={true} />);
    expect(screen.getByRole("button", { name: /reroute plan/i })).toBeDefined();
  });

  it("renders checkout button for new subscription", () => {
    render(<BillingActions plan="business" hasCustomer={false} buttonLabel="Get started" />);
    expect(screen.getByRole("button", { name: /get started/i })).toBeDefined();
  });

  it("renders portal button when already subscribed", () => {
    render(
      <BillingActions
        plan="business"
        hasCustomer={true}
        isSubscribed={true}
        buttonLabel="Current plan"
      />
    );
    expect(screen.getByRole("button", { name: /current plan/i })).toBeDefined();
  });

  it("shows error when checkout API returns error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({ error: "Payment failed" }),
    }));
    render(<BillingActions plan="business" hasCustomer={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByText("Payment failed")).toBeDefined();
    });
  });

  it("shows generic error when checkout fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    render(<BillingActions plan="business" hasCustomer={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeDefined();
    });
  });

  it("shows error when portal API returns error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({ error: "Portal unavailable" }),
    }));
    render(<BillingActions hasCustomer={true} />);
    fireEvent.click(screen.getByRole("button", { name: /reroute plan/i }));
    await waitFor(() => {
      expect(screen.getByText("Portal unavailable")).toBeDefined();
    });
  });

  it("shows generic error when portal fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    render(<BillingActions hasCustomer={true} />);
    fireEvent.click(screen.getByRole("button", { name: /reroute plan/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeDefined();
    });
  });

  it("disables button while loading checkout", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<BillingActions plan="business" hasCustomer={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      const btn = screen.getByRole("button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toMatch(/loading/i);
    });
  });
});

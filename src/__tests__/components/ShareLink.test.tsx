import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShareLink from "@/components/dashboard/ShareLink";

describe("ShareLink", () => {
  describe("when canShare is false", () => {
    it("renders upgrade prompt", () => {
      render(<ShareLink canShare={false} />);
      expect(
        screen.getByText(/paid plan required/i)
      ).toBeDefined();
    });

    it("does not render a generate button", () => {
      render(<ShareLink canShare={false} />);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("when canShare is true", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("renders the WS-0.2 template buttons", () => {
      render(<ShareLink canShare={true} />);
      expect(screen.getByRole("button", { name: /insurance carrier/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /auditor \/ surveyor/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /general contractor/i })).toBeDefined();
      // Custom-recipient template uses the literal label "Recipient" inside
      // a button containing the blurb — match by text rather than role-name.
      expect(screen.getByText(/^Recipient$/)).toBeDefined();
    });

    it("shows loading state while fetching", async () => {
      vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
      render(<ShareLink canShare={true} />);
      fireEvent.click(screen.getByRole("button", { name: /insurance carrier/i }));
      await waitFor(() => {
        expect(screen.getByText(/generating/i)).toBeDefined();
      });
    });

    it("shows the share URL after successful generation", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        json: async () => ({ url: "https://app.operatoros.com/share/abc123" }),
      }));
      render(<ShareLink canShare={true} />);
      fireEvent.click(screen.getByRole("button", { name: /insurance carrier/i }));
      await waitFor(() => {
        const input = screen.getByRole("textbox") as HTMLInputElement;
        expect(input.value).toBe("https://app.operatoros.com/share/abc123");
      });
    });

    it("shows error message when API returns error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        json: async () => ({ error: "Upgrade required" }),
      }));
      render(<ShareLink canShare={true} />);
      fireEvent.click(screen.getByRole("button", { name: /auditor \/ surveyor/i }));
      await waitFor(() => {
        expect(screen.getByText("Upgrade required")).toBeDefined();
      });
    });

    it("shows generic error when fetch throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      render(<ShareLink canShare={true} />);
      fireEvent.click(screen.getByRole("button", { name: /general contractor/i }));
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeDefined();
      });
    });
  });
});

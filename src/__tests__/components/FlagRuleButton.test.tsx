import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FlagRuleButton from "@/app/accountant/[token]/FlagRuleButton";

describe("FlagRuleButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a muted indicator when the deadline has no linked rule", () => {
    render(<FlagRuleButton token="tok" ruleId={null} ruleName="Anything" />);
    // No interactive button — just a span with a tooltip.
    expect(screen.queryByRole("button")).toBeNull();
    const flagSpan = screen.getByText(/^FLAG$/);
    expect(flagSpan).toBeDefined();
  });

  it("opens the form when clicked", () => {
    render(<FlagRuleButton token="tok" ruleId="11111111-1111-4111-8111-111111111111" ruleName="941 quarterly" />);
    fireEvent.click(screen.getByRole("button", { name: /flag rule/i }));
    expect(screen.getByPlaceholderText(/why is this wrong/i)).toBeDefined();
    expect(screen.getByText(/RATIONALE \(REQUIRED/)).toBeDefined();
  });

  it("blocks submit when rationale is too short", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<FlagRuleButton token="tok" ruleId="11111111-1111-4111-8111-111111111111" ruleName="941 quarterly" />);
    fireEvent.click(screen.getByRole("button", { name: /flag rule/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit correction/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/at least 8 characters/i)).toBeDefined();
  });

  it("submits a rationale-only correction with synthetic description change", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, correction_id: "c1" }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(
      <FlagRuleButton
        token="tok"
        ruleId="11111111-1111-4111-8111-111111111111"
        ruleName="941 quarterly"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /flag rule/i }));

    const textarea = screen.getByPlaceholderText(/why is this wrong/i);
    fireEvent.change(textarea, {
      target: { value: "Q1 941 due date is wrong — IRS moved it to April 30." },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit correction/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.token).toBe("tok");
    expect(body.rule_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(body.rationale).toContain("Q1 941");
    expect(body.proposed_changes).toBeTruthy();
  });

  it("surfaces 429 rate-limit response as a user-facing error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: "Too many corrections. Try again in an hour." }),
      })
    );
    render(
      <FlagRuleButton
        token="tok"
        ruleId="11111111-1111-4111-8111-111111111111"
        ruleName="941 quarterly"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /flag rule/i }));
    fireEvent.change(screen.getByPlaceholderText(/why is this wrong/i), {
      target: { value: "Long enough rationale to pass validation." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit correction/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many corrections/i)).toBeDefined();
    });
  });
});

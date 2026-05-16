import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "OperatorOS — Never miss a compliance deadline again";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#F4EDE0",
          color: "#14213D",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "#C8102E",
              color: "#F4EDE0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 28,
            }}
          >
            O
          </div>
          OperatorOS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              color: "#14213D",
              maxWidth: 1000,
            }}
          >
            Never miss a
            <br />
            compliance deadline
            <br />
            <span style={{ color: "#C8102E" }}>again.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: "#14213D",
              opacity: 0.8,
              maxWidth: 900,
            }}
          >
            50-state calendar · statute-cited · risk-weighted score ·
            accountant portfolio view.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#14213D",
            opacity: 0.7,
          }}
        >
          <span>operatoros.com</span>
          <span>14-day free trial · no credit card</span>
        </div>
      </div>
    ),
    size,
  );
}

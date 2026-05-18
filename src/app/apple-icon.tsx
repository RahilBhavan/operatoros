import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          padding: 16,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#C8102E",
            color: "#FFFFFF",
            fontFamily: "sans-serif",
            fontWeight: 900,
            fontSize: 128,
            letterSpacing: "-0.05em",
          }}
        >
          O
        </div>
      </div>
    ),
    size,
  );
}

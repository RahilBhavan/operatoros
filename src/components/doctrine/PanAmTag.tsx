import { type CSSProperties } from "react";

export type TagAgency =
  | "irs"
  | "osha"
  | "state"
  | "license"
  | "insurance"
  | "health";

const AGENCY_HEX: Record<TagAgency, string> = {
  irs: "#C8102E",
  osha: "#E5712D",
  state: "#5A8F3E",
  license: "#4A82B5",
  insurance: "#D9B547",
  health: "#C84F87",
};

export type PanAmTagProps = {
  /** Six-character-or-so serial printed in red on the kraft tab. */
  serial?: string;
  /** Three-letter destination code (IRS, OSHA, SOS, COI, DPH, BIZ). */
  destination: string;
  /** Date or short subtitle below the destination (e.g. "SEP · 30 · 2026"). */
  city?: string;
  /** Top color override; if omitted, derived from `agency`. */
  topColor?: string;
  /** Agency family — maps to one of the six scoped tag colors. */
  agency?: TagAgency;
  /** Routing letter shown at huge scale in the cream bottom (A/B/C/D…). */
  routing?: string;
  /** When true, the routing letter is red Signal; otherwise navy Ink. */
  routingMark?: boolean;
  /**
   * Form-name run shown above the color/cream boundary.
   * `a` is the lighter prefix (e.g. "B-3,"), `b` is the heavy stem (e.g. "941"), `c` is the suffix (e.g. "—Q3").
   */
  formRun?: { a: string; b: string; c?: string };
  /** Left strip line(s) in the top — split with " / " to break into rows. */
  stripLeft?: string;
  /** Right strip line(s) in the top — split with " / " to break into rows. */
  stripRight?: string;
  /** Brand row in the cream bottom. Defaults to "OPERATOR · OS". */
  brand?: string;
  /** Linear scale factor. `1` = the canonical 280×440 design. */
  scale?: number;
  /** Render with a hairline drop shadow to lift the artifact off the page. */
  shadow?: boolean;
};

/**
 * PanAmTag — the deadline artifact. The "destination" is loud; everything else
 * defers. Anatomy: kraft tab with grommet, color-top by agency family,
 * cream-paper bottom, serrated edge. The scoped tag palette never bleeds into
 * app chrome.
 */
export function PanAmTag({
  serial = "004221",
  destination,
  city,
  topColor,
  agency = "irs",
  routing,
  routingMark = true,
  formRun,
  stripLeft = "3077-9412 / FINAL DEADLINE",
  stripRight = "PTD. BY OPS / 5-77/D",
  brand = "OPERATOR · OS",
  scale = 1,
  shadow = false,
}: PanAmTagProps) {
  const s = scale;
  const top = topColor ?? AGENCY_HEX[agency];
  const w = 280 * s;
  const h = 440 * s;

  const tabLayer: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 64 * s,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 6 * s,
    pointerEvents: "none",
  };
  const topLayer: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: 64 * s,
    height: 192 * s,
    padding: `${8 * s}px ${16 * s}px ${22 * s}px`,
    display: "flex",
    flexDirection: "column",
    color: "#14213D",
    pointerEvents: "none",
  };
  const botLayer: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: 256 * s,
    bottom: 36 * s,
    padding: `${12 * s}px ${18 * s}px ${4 * s}px`,
    color: "#14213D",
    display: "flex",
    flexDirection: "column",
    gap: 8 * s,
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        filter: shadow ? "drop-shadow(0 1px 0 rgba(20,33,61,0.12))" : undefined,
      }}
      aria-label={`Deadline tag — ${destination}${city ? ` · ${city}` : ""}`}
      role="img"
    >
      <svg
        viewBox="0 0 280 440"
        width={w}
        height={h}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        {/* color top */}
        <path
          d="M 0 70 Q 0 56 14 56 L 266 56 Q 280 56 280 70 L 280 256 L 0 256 Z"
          fill={top}
        />
        {/* cream bottom + serration */}
        <path
          d="M 0 256 L 280 256 L 280 410
             L 273 423 L 266 410 L 259 423 L 252 410 L 245 423 L 238 410 L 231 423
             L 224 410 L 217 423 L 210 410 L 203 423 L 196 410 L 189 423 L 182 410
             L 175 423 L 168 410 L 161 423 L 154 410 L 147 423 L 140 410 L 133 423
             L 126 410 L 119 423 L 112 410 L 105 423 L 98 410 L 91 423 L 84 410
             L 77 423 L 70 410 L 63 423 L 56 410 L 49 423 L 42 410 L 35 423
             L 28 410 L 21 423 L 14 410 L 7 423 L 0 410 Z"
          fill="#F4EDE0"
        />
        <line
          x1="0"
          y1="256"
          x2="280"
          y2="256"
          stroke="#14213D"
          strokeWidth="1.2"
        />
        {/* kraft tab + grommet */}
        <path
          d="M 98 6 Q 98 0 104 0 L 176 0 Q 182 0 182 6 L 182 64 L 98 64 Z"
          fill="#C9A576"
        />
        <rect x="98" y="61" width="84" height="3" fill="#14213D" opacity="0.20" />
        <circle cx="140" cy="30" r="7" fill="#FFFFFF" stroke="#14213D" strokeWidth="1.2" />
      </svg>

      {/* Kraft tab layer */}
      <div style={tabLayer}>
        <div
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 800,
            fontSize: 11 * s,
            letterSpacing: "0.06em",
            color: "#C8102E",
            lineHeight: 1,
          }}
        >
          {serial}
        </div>
        <div
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 800,
            fontSize: 12 * s,
            letterSpacing: "0.04em",
            color: "#14213D",
            marginTop: 30 * s,
            lineHeight: 1,
          }}
        >
          {destination}
        </div>
      </div>

      {/* Color-top layer */}
      <div style={topLayer}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 700,
              fontSize: 8 * s,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              lineHeight: 1.3,
            }}
          >
            {stripLeft.split(" / ").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <div
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 700,
              fontSize: 8 * s,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              lineHeight: 1.3,
              textAlign: "right",
            }}
          >
            {stripRight.split(" / ").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", margin: `${6 * s}px 0 0` }}>
          <div
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: 88 * s,
              letterSpacing: "-0.02em",
              lineHeight: 0.9,
              color: "#14213D",
            }}
          >
            {destination}
          </div>
          {city ? (
            <div
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 700,
                fontSize: 17 * s,
                letterSpacing: "0.10em",
                lineHeight: 1,
                marginTop: 6 * s,
                color: "#14213D",
              }}
            >
              {city}
            </div>
          ) : null}
        </div>

        {/* Sort run — centered above the red/cream boundary with breathing room.
            (chat2 fix: was left-aligned and crashed into the boundary.) */}
        {formRun ? (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: 6 * s,
              lineHeight: 1,
              paddingBottom: 4 * s,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 800,
                fontSize: 16 * s,
                color: "#14213D",
              }}
            >
              {formRun.a}
            </span>
            <span
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 900,
                fontSize: 22 * s,
                color: "#14213D",
              }}
            >
              {formRun.b}
              {formRun.c}
            </span>
          </div>
        ) : null}
      </div>

      {/* Cream-bottom layer */}
      <div style={botLayer}>
        {/* Brand row — centered in the cream area (chat2 fix). */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8 * s, alignItems: "center" }}>
          <svg
            width={14 * s}
            height={14 * s}
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <ellipse cx="7" cy="7" rx="6" ry="6" stroke="#14213D" strokeWidth="1.2" />
            <ellipse cx="7" cy="7" rx="2.6" ry="6" stroke="#14213D" strokeWidth="1" />
            <line x1="1" y1="7" x2="13" y2="7" stroke="#14213D" strokeWidth="1" />
            <line x1="1" y1="4" x2="13" y2="4" stroke="#14213D" strokeWidth="0.8" />
            <line x1="1" y1="10" x2="13" y2="10" stroke="#14213D" strokeWidth="0.8" />
          </svg>
          <div
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: 12 * s,
              letterSpacing: "0.20em",
              color: "#14213D",
            }}
          >
            {brand}
          </div>
        </div>

        {/* Routing — chevron and routing letter on a balanced 1fr/1fr grid (chat2 fix). */}
        {routing ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              alignItems: "center",
              gap: 4 * s,
              marginTop: 4 * s,
            }}
          >
            <div style={{ justifySelf: "start", position: "relative" }}>
              <div
                style={{
                  fontFamily: "var(--font-destination)",
                  fontWeight: 800,
                  fontSize: 9 * s,
                  letterSpacing: "0.16em",
                  lineHeight: 1.1,
                  color: "#14213D",
                  padding: `${5 * s}px ${8 * s}px`,
                  border: "1.2px solid #14213D",
                  background: "#F4EDE0",
                  display: "inline-block",
                }}
              >
                ROUTING
                <br />
                SYMBOL
              </div>
              <span
                style={{
                  position: "absolute",
                  right: -10 * s,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: `${10 * s}px solid #14213D`,
                  borderTop: `${9 * s}px solid transparent`,
                  borderBottom: `${9 * s}px solid transparent`,
                }}
                aria-hidden="true"
              />
            </div>
            <div
              style={{
                justifySelf: "end",
                fontFamily: "var(--font-destination)",
                fontWeight: 900,
                fontSize: 86 * s,
                letterSpacing: "-0.03em",
                lineHeight: 0.9,
                textAlign: "right",
                color: routingMark ? "#C8102E" : "#14213D",
                paddingRight: 8 * s,
              }}
            >
              {routing}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

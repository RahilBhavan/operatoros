# The Tag Doctrine

<!-- Last reviewed: 2026-05-16 — owner: rbhavanzim@gmail.com -->
<!-- Update trigger: any change to `src/app/globals.css` tokens or to the doctrine components in `src/components/doctrine/`. -->

*A design philosophy extracted from vintage Pan Am luggage tags.*
*Reviewed by a five-person jury (Jobs, Rams, Ive, Vignelli, Scher) over three revisions.*
*Final scores: 9.2 · 9.0 · 9.0 · 9.5 · 9.2.*

> **2026-05-16 — White pivot.** Originally a cream Pan Am artifact (Field `#F4EDE0`), the system pivoted to a clean white SaaS surface. The three roles are now **Surface (white) · Ink (navy) · Signal (red)**. The cream + kraft + six-agency tag palette is preserved but scoped to a single product artifact — the deadline tag — and never bleeds into app chrome. The legacy Field / Ground / Mark names are kept as aliases so the doctrine's vocabulary continues to read in code; "Surface · Ink · Signal" is the canonical naming going forward.

---

## Manifesto

Attention is the last honest currency, and most contemporary design is counterfeiting it. A surface earns its existence only by routing a person, an object, or a decision to where it belongs. Everything else is decoration pretending to be design.

The Pan Am tag did not seduce. It declared *LHR* and got out of the way of the hand carrying it. The artifact serves the human; the human does not serve the artifact. We design for the second of attention a person can spare us — not the minute they cannot.

---

## The Six Tenets

### 1. Destination Over Decoration

Every artifact answers one question: *where does this go?* The destination is the loudest mark on the surface. If a viewer can name the brand before the destination, the hierarchy has failed and the artifact is decoration with a job title.

### 2. Scale Is Argument

Hierarchy is not suggestion; it is force. Destination, Index, Utility hold a strict **4:2:1** tier proportion. Primary information is set at **3× the size required for legibility** at the specified reading distance. Restraint is not smallness — restraint is making the necessary thing unmissable and the rest quiet.

### 3. The Artifact Has Weight; The Hand Has Memory

Declare reading distance, light, second of attention, failure mode, and attach point. The artifact disappears into the hand that holds it; if the reader notices the design before the destination, we have placed ourselves in front of the person we were hired to serve — disqualifying.

> *"If it cannot be gripped, stamped, or torn, it is not an artifact, it is a slide."*

### 4. Color Is Function, Type Is Infrastructure

Color is signal — Field, Ground, Mark — fixed by hex. Type is load-bearing — chosen because it has carried this kind of weight before, on railway boards and shipping manifests.

### 5. The System Counts Itself

A doctrine that cannot remember its own arithmetic is decoration. **Six tenets. Six refusals. Four tests. Three colors. Three types.** If a category cannot be enumerated, it does not belong in the system.

### 6. Every Artifact Justifies Its Existence

Long-lasting beats novel. Repairable beats refreshable.

> *"Recycled stock, vegetable ink, no foil, no lamination — the artifact must justify its material existence at the moment of disposal, not only at the moment of use."*

---

## The System

### The Body

| Parameter | Specification |
|---|---|
| Reading distance | Declared in cm (held), m (posted), or px-from-eye (screen) |
| Light | Worst-case ambient — overcast street, fluorescent terminal, sodium platform, 200-nit phone in sun |
| Attention-second | Primary message resolves within **1 second** of arrival |
| Failure mode (print) | gsm + tear resistance |
| Failure mode (digital) | Loading state, offline state, latency ceiling, error path |
| Attach point | Grommet, string, adhesive, stitch — named, never implied |

**Weight is the first impression.**
- Print: 280gsm uncoated card at tag size = **~3.5g** in the hand before the eye parses a character
- Digital: **≤100ms** to first pixel; **joules-per-interaction** measured, not estimated

**Aging.** Paper softens at the corners within a week of handling. Ink yellows over years of UV. Thread frays where the hand grips. Named explicitly in the specimen.

**The Stressed Body.** The reader is tired, gloved, colorblind, dyslexic, one-handed, in the rain.

- Contrast ≥ **7:1** Destination · ≥ **4.5:1** Utility (WCAG AAA / AA)
- Dyslexic-safe fallback: Atkinson Hyperlegible at Utility tier when accessibility mode is active
- One-handed (digital): primary actions inside thumb arc on a 6.7" screen
- Glove-tolerant tap targets ≥ **44pt**
- Rain/sweat-tolerant substrate (print): **280gsm uncoated**

Design for the floor of capacity, not the ceiling.

### Color — three hex values, no exceptions

| Role | Hex | Use |
|---|---|---|
| **Surface** (`--color-field`) | `#FFFFFF` | Page background, app chrome — always behind type. |
| **Ink** (`--color-ground`) | `#14213D` | Type, rules, primary buttons, dark-mode panels, every load-bearing mark. |
| **Signal** (`--color-mark`) | `#C8102E` | Destination dates, alarm, stamps, overdue. Reserved — never decoration. |

No tints. No shades. No opacity below 100%. No gradients. The app chrome runs on these three values only.

### Tag artifact palette — scoped to the deadline tag, never app chrome

The deadline tag is a printed-looking object that sits inside the white app: kraft tab with grommet, agency color top, cream paper bottom, serrated edge. The tag carries its own palette and the tag is the only place it appears.

| Token | Hex | Use |
|---|---|---|
| `--color-tag-paper` | `#F4EDE0` | Cream lower-half of every tag |
| `--color-tag-kraft` | `#C9A576` | Brown header tab with grommet |
| `--color-tag-irs` | `#C8102E` | IRS · federal tax |
| `--color-tag-osha` | `#E5712D` | OSHA · DOL · safety |
| `--color-tag-state` | `#5A8F3E` | State filings · SOS · DOR |
| `--color-tag-license` | `#4A82B5` | Local business license · city/county |
| `--color-tag-insurance` | `#D9B547` | COI · GL · workers' comp |
| `--color-tag-health` | `#C84F87` | DPH · food handler · pharmacy |

Each deadline routes to one of six agency families; the agency family sets the tag top color. The `PanAmTag` component (`src/components/doctrine/PanAmTag.tsx`) is the only consumer.

### Type — three roles

| Tier | Typeface | Lineage |
|---|---|---|
| **Destination** | Akzidenz-Grotesk Bold | 1898 — railway, kiosk, luggage tag |
| **Index** | Rockwell or Stymie | Shipping manifest, crate stencil |
| **Utility** | Akzidenz-Grotesk Regular, small caps | Captions, metadata |

- **Modular scale:** 1.250 (minor third)
- **Steps:** 12 · 15 · 19 · 24 · 30 · 38 · 48 · 60 · 75 pt
- **Tier proportion:** 4 : 2 : 1
- **Leading:** 1.4× (body ≤19pt) · 1.15× (display ≥38pt) · 1.0× (threshold ≥60pt)
- **Optical sizes:** Caption (≤12pt) · Text (13–24pt) · Subhead (25–38pt) · Display (≥48pt) · Marquee (≥60pt)

### Grid

- 8pt base unit
- 4pt baseline rhythm
- 12 columns
- 1u gutter / 3u margin
- Fibonacci spacing scale: 1× · 2× · 3× · 5× · 8×
- Format ratio: **2:3** (portrait or landscape, never square)

### Iconography

Single-weight diagrammatic. No outlines-plus-fills. No double-strokes. No flourishes. If a draftsman with a ruler and a brush cannot reproduce it, it does not belong.

> *Honest Imperfection — letterpress mis-register, the soft bite of a stamped serial — survives in this system only as a print-craft constraint. Never as a digital filter.*

---

## The Six Refusals

1. **Neutrality** — refusing to argue is itself an argument, made badly
2. **Gradients** — color is function, not atmosphere
3. **Centered body text** — alignment is a structural commitment
4. **Lifestyle photography** — the artifact routes; it does not pretend to be a feeling
5. **Brand mark larger than destination** — the surface serves the reader, not the issuer
6. **Light gray on white** — contrast is a duty, not a mood

---

## The Four Tests

1. **Three-Second Test** — at specified distance and worst-case light, can a stranger name the destination in under three seconds?
2. **Corner Test** — gripped between thumb and forefinger, does it still resolve?
3. **Subtraction Test** — remove one element. If routing survives, the element was decoration. Repeat until removal breaks the route.
4. **Reproduction Test** — can a competent practitioner in Bologna redraw it from the three hex, three type roles, and stated grid alone? If not, the system is not yet a system.

---

## The Book

The doctrine ends in a **specimen manual** — a printed object that demonstrates every rule it states. Cover stock specified. Binding specified. The Pan Am tag reproduced at scale. Color chips at full bleed. Type specimens at every step of 1.250. The six refusals shown as crossed-out examples. The four tests run on a real artifact, photographed in the worst-case light each test demands.

The book is not documentation of the system; it is the system, made gripped and stamped and tearable in the reader's hand.

---

## Jury

| Critic | v1 | v2 | v3 | Final verdict |
|---|---|---|---|---|
| Steve Jobs | 6.0 | 8.5 | **9.2** | "Ships." |
| Dieter Rams | 6.0 | 8.0 | **9.0** | "Confirmed." |
| Jony Ive | 6.0 | 7.5 | **9.0** | "Ship it." |
| Massimo Vignelli | 6.0 | 8.5 | **9.5** | "Do not add a seventh anything." |
| Paula Scher | 6.0 | 8.5 | **9.2** | "Put it on a wall." |

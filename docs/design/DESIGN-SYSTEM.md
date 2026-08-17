> ⚠️ **SUPERSEDED.** Absorbed into [../ATLAS_DESIGN_SYSTEM_V1.md](../ATLAS_DESIGN_SYSTEM_V1.md),
> which is the authoritative visual and interaction standard. Kept for the
> measurement history only — do not build from it.

# Atlas Creed — Design System

**Status:** Proposed v0.1 — not ratified
**Canon:** [../canon/ATLAS-CREED-BIBLE.md](../canon/ATLAS-CREED-BIBLE.md) §11–§14
**Tokens:** [tokens.css](tokens.css)

This document translates the Bible's visual sections into decisions a build can be
held against. §11–§14 describe intent; this describes values, rules, and the tests
that determine whether a screen complies.

Nothing here is implemented. No stack decision depends on it.

---

## How this document was produced

Every colour was measured rather than chosen by eye, because two of the canon's
requirements are only enforceable as numbers:

- "Never cheap metallic excess" is a saturation problem.
- "Never neon gamer purple" is a saturation problem.

Where a measurement contradicted an intuition, the measurement won and the rule was
rewritten around it. Three rules in this document exist *because* the numbers came
back badly — Laws 03, 05, and 06. They are the most valuable part of the system,
because each one prevents a mistake that would otherwise have looked correct.

---

## 1. Obsidian — the environment (§11)

A violet-cast neutral ramp at hue ~250°, saturation 8–14%. The hue bias is toward
the purple accent so ambient washes dissolve into the ground rather than floating
on it. A pure-grey ramp reads as unconsidered; a warm-grey ramp fights the gold.

| Token | Value | Luminance | Role |
|---|---|---|---|
| `obsidian-950` | `#09090D` | 0.0028 | Void. App ground. |
| `obsidian-900` | `#0E0E13` | 0.0045 | Base canvas. |
| `obsidian-850` | `#14141B` | 0.0073 | Raised: rails, headers, wells. |
| `obsidian-800` | `#1A1A23` | 0.0108 | Cards and panels. |
| `obsidian-750` | `#21212C` | 0.0159 | Overlays. |
| `obsidian-700` | `#2A2A37` | 0.0242 | Structural border. |
| `obsidian-650` | `#353544` | 0.0381 | Interactive border. |

Steps rise by ~1.4× the previous delta, keeping elevation legible at the dark end
where the eye is least sensitive.

> **Law 01 — Elevation is luminance first, shadow second, glow never.**
> If a raised element is not also a lighter surface, no amount of shadow will make it
> read as raised. Shadow refines a relationship the surface has already established.

---

## 2. Gold — authority (§11)

Brass-leaning and deliberately desaturated. Jewellery gold (`#FFD700`) and the
standard metallic (`#D4AF37`) both read as ornament, which is precisely the "cheap
metallic excess" the canon prohibits.

| Token | Value | On `800` | Role |
|---|---|---|---|
| `gold-100` | `#F5EDD8` | 14.79:1 | Highest emphasis. Rare. |
| `gold-200` | `#EBDCB4` | 12.69:1 | Emphasis on tinted surfaces. |
| `gold-300` | `#DEC488` | 10.16:1 | Gold text and icons. |
| `gold-400` | `#CBAA5E` | 7.77:1 | Primary interactive. Focus ring. |
| `gold-500` | `#B4913F` | 5.81:1 | Fills. |
| `gold-600` | `#8F7130` | — | Pressed. |
| `gold-900` | `#2A2113` | — | Tinted wash. |

> **Law 02 — Gold is scarce.**
> Under 5% of pixels in any view; exactly one primary action per screen. Gold never
> divides, never decorates, never fills a large surface, and never sets body copy.
> A second gold button means one of them is not primary — resolve the hierarchy
> rather than duplicating the accent.

> **Law 03 — Text on gold fill is obsidian, never white.**
> White on `gold-500` measures **2.97:1** and fails. Obsidian-950 measures **6.68:1**
> and passes. This is the most likely accessibility mistake in the system, because
> white-on-accent is the reflex everywhere else.

---

## 3. Imperial purple — cognition (§11)

Strictly rationed: Atlas cognition states, ambient depth, and differentiating other
Atlas agents from Atlas Creed. Hard saturation ceiling of **46%**. The reference
offender — "gamer violet" `#8B5CF6` — sits at 89.5%.

| Token | Value | Saturation | Role |
|---|---|---|---|
| `purple-300` | `#A492CE` | 38% | Max text purple. Sparing. |
| `purple-400` | `#8467B8` | 36% | State indicator. Non-text. |
| `purple-500` | `#63459B` | 38% | Fill only. **Never text** (2.35:1). |
| `purple-600` | `#4F2F7C` | 45% | Core imperial. Ceiling. |
| `purple-800` | `#2C1A47` | — | Depth wash. |
| `purple-900` | `#1B1030` | — | Ambient ground blend. |

> **Law 04 — Purple never competes with gold.**
> Where both appear, gold is foreground authority and purple is background state.
> Purple is never a primary action, never a focus ring, never body text.

---

## 4. Signal — status (§28, §29)

Status colour in a gold-branded system has one hard problem: **amber**. Every usable
amber sits within 21° of `gold-400` and reads as brand chrome rather than as a
warning — a trust failure disguised as a palette choice.

**The system therefore has no amber.** Caution was pushed to hue 15.5°, a full 26.3°
clear of gold, which lands it 11.1° from critical.

| Token | Value | On `800` | Hue | Role |
|---|---|---|---|---|
| `signal-positive` | `#6FBF9A` | 7.89:1 | 152° | Succeeded, healthy. |
| `signal-caution` | `#CB8972` | 6.05:1 | 15.5° | Degraded, at risk. |
| `signal-critical` | `#E07A72` | 5.92:1 | 4.4° | Failed, blocked. |
| `signal-atlas` | `#8467B8` | 3.79:1 | 261° | Atlas thinking or acting. |
| `signal-neutral` | `#6E6D7C` | 3.41:1 | 249° | Idle, unknown. |

> **Law 05 — Caution and critical are 11.1° apart, so colour alone cannot
> distinguish them.** Both must carry an icon and a text label. A bare coloured dot
> is prohibited for these two states. Under §29, a status the owner can misread is a
> status that lies.

> **Law 06 — Status uses tint, border, and text — never a solid fill.**
> Solid semantic fills fail in both directions: obsidian text on the caution fill
> measures 4.38:1 and white measures 4.54:1, so neither is safely legible. A 14% tint
> with a 30% border and full-strength text clears 6:1 and is quieter besides.

---

## 5. Typography (§12)

The scale, weights, and tracking are the durable decisions and hold regardless of
which faces are licensed. **Typeface selection is an open decision** — see §10 below.

| Role | Size / LH | Tracking | Weight |
|---|---|---|---|
| Display | 44 / 48 | −0.021em | 600 |
| H1 | 26 / 32 | −0.014em | 600 |
| H2 | 20 / 26 | −0.010em | 600 |
| H3 | 17 / 24 | −0.006em | 600 |
| Body | 15 / 24 | 0 | 400 |
| Caption | 12 / 16 | 0 | 400 |
| **Label** | **11 / 14** | **+0.09em** | **600 mono, uppercase** |
| Data | 13 / 18 | 0 | 450 mono, tabular |

Measure: **68ch** for prose, **46ch** for UI copy.

The monospace instrument label carries the aerospace influence §12 asks for without
a single decorative element. It is used for metadata, field labels, section eyebrows,
and readouts — and never for anything read as a sentence.

---

## 6. Geometry (§12)

Tight radii read as instrument and industrial; generous radii read as consumer app.

| Token | Value | Applies to |
|---|---|---|
| `radius-xs` | 2px | Chips, tags, status markers |
| `radius-sm` | 4px | Inline elements |
| `radius-md` | 6px | Buttons, inputs — the control radius |
| `radius-lg` | 10px | Cards, panels — the surface radius |
| `radius-xl` | 14px | Modals, sheets. **Maximum permitted.** |

Pill shapes are prohibited outside avatars. A fully rounded interface is the fastest
route to looking like every other product.

---

## 7. Motion (§14)

Each animation is assigned to a specific message. No spring, no bounce, no overshoot
on chrome.

| Signature | Duration | Curve | Form |
|---|---|---|---|
| Atlas thinking | 2400ms loop | emphasis | Purple sweep along a hairline |
| Information arriving | 340ms, 40ms stagger | entrance | 8px rise + fade |
| Command executing | determinate | **linear** | Gold progress hairline |
| Context changing | 520ms | standard | Cross-dissolve, never slide |
| Background process | static | — | 1px edge presence, no motion until state change |
| Mode transition | 520ms | standard | Surface luminance shift |

Two deliberate choices:

- **Determinate progress is linear.** An eased progress bar misrepresents elapsed
  time — a §29 violation dressed as polish.
- **Context change dissolves, never slides.** Sliding implies spatial adjacency the
  underlying contexts do not have.

`prefers-reduced-motion` is mandatory: ambient motion stops entirely; functional
transitions collapse to near-instant rather than vanishing, so state changes stay
perceivable.

---

## 8. Prohibited (§13)

§13's list, made testable. Each of these fails review:

- Glowing borders, emissive edges, coloured drop shadows
- Multi-hue or neon gradients; gradients are permitted only as a hairline or an edge
  of ≤2px
- Pulsing orbs of any kind as an activity or cognition indicator
- Glass/blur panels as a default surface treatment
- Particle effects, sci-fi grids, circuit motifs, robot imagery
- Border radius above 14px, or pill shapes outside avatars
- Charts that display no decision-relevant quantity
- Any animation with overshoot on interface chrome

> **Law 07 — Atlas looks advanced because the interaction model is advanced.**
> Any treatment whose only justification is "it looks futuristic" fails review. If an
> effect cannot name the information it carries, it is removed.

---

## 9. Review test

A screen complies when all seven pass:

1. Gold occupies under 5% of pixels and marks exactly one primary action.
2. Every text/background pair clears 4.5:1, or 3:1 for text above 24px.
3. Elevation is expressed by surface luminance before shadow. No glow.
4. Caution and critical states carry an icon and a label, not colour alone.
5. Every animation names the information it carries.
6. Nothing exceeds `radius-xl`.
7. Nothing on the §13 list appears.

---

## 10. Open decisions (§33)

These are the owner's to make. The system is built so each can change without
reworking anything already specified.

**01 — Typeface.** Scale and tracking are set; faces are not. Recommendation:
**Söhne** for display/UI with **Berkeley Mono** for the instrument register — both
licensed, both carrying the required precision. No-cost path: Inter Display with
JetBrains Mono, at the price of looking like a great many other products.

**02 — Dark only, or a light theme later.** This system commits to a single dark
world, because §11 names obsidian as *the dominant environment* and a light Atlas
would contradict the canon. If a light theme is ever needed for print, sharing, or
daylight use, scope it as an explicit exception rather than a second first-class
theme.

**03 — The gold ratio.** Law 02's 5% is a considered starting point, not a measured
one. Worth revisiting once real screens exist — it is the single variable that most
determines whether Atlas reads as precise or as ornate.

**04 — Whether purple earns its place.** Purple currently does one job: marking
cognition and distinguishing other Atlas agents. Until the ecosystem in §4 exists, a
two-colour system — obsidian and gold — may be stronger. Holding purple in the tokens
costs nothing; deploying it before it has work to do would violate §26.

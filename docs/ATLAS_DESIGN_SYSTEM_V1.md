# ATLAS CREED
## Design System V1

**Status:** Ratified and approved
**Governs:** all V1 interface work from Phase 1 onward
**Canon:** [canon/ATLAS-CREED-BIBLE.md](canon/ATLAS-CREED-BIBLE.md) §11–§14 · [ATLAS_V1_BUILD_PLAN.md](ATLAS_V1_BUILD_PLAN.md) §16
**Supersedes:** `docs/design/DESIGN-SYSTEM.md` (earlier exploration; values carried forward where measured)

Every colour in this document was measured, not chosen by eye. Contrast ratios
are WCAG 2.1 against the surface named beside them. Where a measurement
contradicted an intention, the measurement won and the rule was rewritten
around it — three of the rules here exist for exactly that reason.

---

# 0. THE THESIS

**Atlas is an environment, not an application.**

A SaaS product presents *chrome* — panels, cards, toolbars — and puts content
inside it. Atlas inverts that: the environment recedes almost to nothing, and
what remains is thinking, rendered as text, at a comfortable reading measure,
in a room with the lights low.

That single idea produces almost every rule below. Surfaces barely differ
because differentiation is a cost, not a feature. Borders are hairlines because
a visible box implies a container, and Atlas is not a container. Gold is rare
because a signature applied everywhere is a texture. Purple is absent at rest
because cognition is an *event*, not a decoration.

**The grayscale test.** Convert any Atlas screen to grayscale. It should still
be unmistakably Atlas — legible hierarchy, deliberate rhythm, generous measure,
nothing floating, nothing shouting. If the identity collapses without colour,
the identity was colour, and colour is the least durable thing we own.

**The twenty-minute test.** A screenshot that impresses and an interface that
sustains eight hours of serious work are different artifacts, and they are
frequently in opposition. Every decision here resolves toward the second.

---

# 1. DARK-ONLY V1 — AND ITS HONEST COST

## Recommendation: commit to dark-only for V1

**Why it fits this product**

- **Session length and time of day.** Atlas is a thinking environment used early,
  late, and for long stretches. A luminous interface in a dim room is fatiguing
  in a way a dim interface in a lit room is not.
- **Content is the subject.** Dark ground lets text and one accent carry the
  entire hierarchy. Bible §11 names obsidian as *the dominant environment*, not
  a theme option.
- **Single owner, known devices.** There is no audience with unknown viewing
  conditions to accommodate. The cost/benefit of maintaining two themes is
  entirely on the cost side in V1.
- **Every component gets designed once, properly.** Dual-theme components
  compromise both. One theme, fully considered, beats two half-tuned.

## The cost, stated plainly

Dark-only is not free, and the brief invited challenge:

1. **Halation.** Light text on very dark grounds blooms for readers with
   astigmatism — a large fraction of adults. Long-form reading is exactly where
   this bites.
2. **Daylight legibility.** A phone in direct sun is the worst case for a dark
   interface, and mobile is the primary target.
3. **Pure black is the aggravating factor**, not darkness itself. Maximum
   contrast maximises bloom.

## Mitigations, which are non-negotiable

- **Never `#000000` and never `#FFFFFF`.** The darkest surface is `#09090D`;
  the brightest text is `#F2F1F5` (17.12:1, not 21:1). This alone materially
  reduces halation.
- **Generous leading on long-form**: 1.6 minimum for body, 1.65 for AI prose.
- **Never set body copy in tertiary text.** See §3.
- **Token architecture already supports a second theme.** Semantic tokens name
  roles, not colours, so a future *Daylight* variant is a primitives file — not
  a rewrite. We are not building it; we are not foreclosing it.

**If the owner reports eye strain during Phase 7 daily use, the answer is a
Daylight variant, not abandoning the aesthetic.**

---

# 2. COLOUR SYSTEM

## 2.1 Obsidian — the environment

Not generic black. A violet-cast neutral ramp at hue ~250°, saturation 8–14%.
The hue bias points toward the purple accent so ambient cognition states
dissolve into the ground instead of floating on it. A pure-grey ramp reads
unconsidered; a warm-grey ramp fights the gold.

| Token | Value | Luminance | Role |
|---|---|---|---|
| `obsidian-950` | `#09090D` | 0.0028 | Void — app ground, behind everything |
| `obsidian-900` | `#0E0E13` | 0.0045 | **Base** — the primary working surface |
| `obsidian-850` | `#14141B` | 0.0073 | Raised — rails, headers, inset wells |
| `obsidian-800` | `#1A1A23` | 0.0108 | Card — panels, dialogs |
| `obsidian-750` | `#21212C` | 0.0159 | Overlay — popovers, menus |
| `obsidian-700` | `#2A2A37` | 0.0242 | Structural border |
| `obsidian-650` | `#353544` | 0.0372 | Interactive border, hover edge |

Steps rise by roughly 1.4× the previous delta, which keeps elevation legible at
the dark end where the eye is least sensitive.

## 2.2 Atlas Gold — the signature

### Recommendation: a distinct Atlas gold family, related to but not identical with Groomed Gent's `#C4912F`

Measured comparison:

| Colour | Hue | Sat | On card | Obsidian-on-fill |
|---|---|---|---|---|
| `#C4912F` Groomed Gent | 39.5° | 61.3% | 6.12:1 | 7.04:1 |
| `#CBAA5E` proposed Atlas | 41.8° | 51.2% | 7.77:1 | 8.95:1 |
| `#D4AF37` classic metallic | 45.9° | 64.6% | 8.21:1 | — |

`#C4912F` is a good colour — it clears AA comfortably and takes obsidian text
well. **The argument against adopting it is hierarchical, not chromatic.**

Bible §4 establishes Atlas Creed as the *original* Atlas, parent to an ecosystem
that will eventually include company-specific Atlas systems — Groomed Gent's
among them. If Atlas Creed wears Groomed Gent's exact signature colour, the
parent reads as a Groomed Gent product. That inverts the hierarchy the canon
spends a whole section establishing.

The right relationship is **siblings in a house**: recognisably related, clearly
distinct. Atlas Creed's gold is the *restrained* one — cooler by two degrees of
hue, ten points less saturated. Company Atlases can run warmer and more
saturated; the parent stays the most disciplined object in the family.

### The family

| Token | Value | On card | Role |
|---|---|---|---|
| `gold-100` | `#F5EDD8` | 14.79:1 | Highest emphasis. Rare. |
| `gold-200` | `#EBDCB4` | 12.69:1 | Emphasis on gold-tinted surfaces |
| `gold-300` | `#DEC488` | 10.16:1 | **Gold text and icons** |
| `gold-400` | `#CBAA5E` | 7.77:1 | **Primary interactive** — borders, focus ring, active nav |
| `gold-500` | `#B4913F` | 5.81:1 | **Fills.** Obsidian text only. |
| `gold-600` | `#8F7130` | — | Pressed / active |
| `gold-900` | `#2A2113` | — | Tinted wash, low opacity only |

**Law: text on a gold fill is obsidian, never white.** White on `gold-500`
measures **2.97:1** and fails outright; obsidian-950 measures **6.68:1** and
passes. This is the single most likely accessibility mistake in the system,
because white-on-accent is the reflex everywhere else.

## 2.3 Imperial Purple — cognition

| Token | Value | Sat | On card | Role |
|---|---|---|---|---|
| `purple-300` | `#A492CE` | 38.0% | 6.23:1 | Maximum text purple. Rare. |
| `purple-400` | `#8467B8` | 36.3% | 3.79:1 | **State indicator.** Non-text only. |
| `purple-500` | `#63459B` | 38.4% | 2.35:1 | Fill only. **Never text.** |
| `purple-600` | `#4F2F7C` | 45.0% | 1.67:1 | Ambient wash — ceiling value |

**Hard saturation ceiling: 46%.** The reference offender — "gamer violet"
`#8B5CF6` — sits at **89.5%**. That number is the rule; anything above 46%
is rejected regardless of how it looks in isolation.

`purple-400` at 3.79:1 clears the 3:1 threshold for non-text UI components,
which is exactly its job. `purple-500` failing as text at 2.35:1 is a property
of the hue at this saturation, not an oversight to work around.

## 2.4 Semantic signals

| Token | Value | Hue | Sep. from gold | On card |
|---|---|---|---|---|
| `signal-positive` | `#6FBF9A` | 152.2° | 110.4° | 7.89:1 |
| `signal-caution` | `#CB8972` | 15.5° | 26.3° | 6.05:1 |
| `signal-critical` | `#E07A72` | 4.4° | 37.4° | 5.92:1 |
| `signal-thinking` | `#8467B8` | 261.5° | 219.7° | 3.79:1 |
| `signal-neutral` | `#6E6D7C` | 249° | — | 3.41:1 |

**There is no amber in this system.** Every usable amber sits within ~21° of
`gold-400` and reads as brand chrome rather than as a warning — a trust failure
disguised as a palette choice. Caution was pushed to 15.5°, which puts it 26.3°
clear of gold but only **11.1° from critical**.

**Law: caution and critical cannot be distinguished by colour alone.** Both must
carry an icon and a text label. A bare coloured dot is prohibited for these two
states.

---

# 3. COLOUR RATIOS AND RULES

## The ratios — and where I disagree with the brief

| Element | Brief | **Recommendation** | Why |
|---|---|---|---|
| Gold | 5–8% | **≤5% ceiling, 2–3% typical** | At 8% coverage gold stops reading as precious and starts reading as a colour scheme. A signature is defined by scarcity. |
| Purple | 1–3% | **0% at rest, ≤2% during cognition** | Purple is an *event*, not a presence. A screen showing purple when Atlas is idle has spent the signal for nothing. |
| Neutral text | — | ~70–80% of all ink | The interface is text |
| Obsidian | — | the remainder | The environment |

**The purple rule is the sharper change.** Treating purple as "1–3% always
present" makes it decoration. Treating it as "absent unless Atlas is thinking"
makes it *meaningful* — the owner learns that purple means cognition because it
only ever appears then. That is worth far more than ambient atmosphere.

## When to use what

| Use | Colour |
|---|---|
| Body text, AI prose | `text-primary` `#F2F1F5` |
| Secondary prose, descriptions | `text-secondary` `#A8A7B4` |
| Metadata, timestamps, labels | `text-tertiary` `#6E6D7C` — **large/short text only** |
| Disabled | `text-disabled` `#565565` — WCAG-exempt |
| Selected row, active nav | `gold` tint + `gold-400` edge |
| Keyboard focus | `gold-400` ring, always |
| Primary command | gold — see §10 |
| Atlas thinking / retrieving | `purple-400`, motion only |
| Destructive | `signal-critical` + icon + label |
| Success confirmation | `signal-positive` + icon |

## Prohibited combinations

- **White text on any gold fill** (2.97:1 — fails)
- **Purple text below `purple-300`** (`purple-500` = 2.35:1)
- **Gold on purple, or purple on gold** — the two signatures never touch;
  they mean different things and adjacency muddies both
- **Caution or critical as colour alone** (11.1° apart)
- **Tertiary text for body copy** (3.41:1 — legal for large text, punishing for
  paragraphs)
- **Gold as a background for large regions** — gold is an edge, a mark, or a
  small fill
- **Any two accent colours in one control**

## Accessibility floor

- Body text ≥ **7:1** (AAA) — `text-primary` is 15.36:1, `text-secondary` 7.28:1
- Any text ≥ **4.5:1**; large text (≥24px) ≥ **3:1**
- Non-text UI components ≥ **3:1**
- Focus indicator ≥ **3:1** against both the component and its surround —
  `gold-400` at 7.77:1 clears this everywhere in the ramp

---

# 4. TYPOGRAPHY

## The constraint that decides this section

Atlas will render long conversations, strategy documents, research, and code.
**Long-form reading quality outranks visual novelty**, and it is not close.

## Recommendation: system-first for V1. Ship no webfont.

This will look like the boring answer. It is the right one, and the reasoning is
specific rather than lazy:

1. **On the owner's devices, the system face is SF Pro** — among the best
   screen-reading UI typefaces in existence, hinted and optically sized by the
   platform, and free.
2. **Zero webfont payload.** V1 §32 makes launch speed a product requirement.
   A webfont is render-blocking weight on exactly the surface that must feel
   instant on a phone.
3. **No FOUT/FOIT to engineer around** on a streaming text interface where text
   arrives continuously.
4. **No licensing decision made under time pressure.** The brief forbids
   bundling fonts without approval; system-first sidesteps it entirely.
5. **The cross-platform inconsistency argument mostly evaporates** for a
   single-owner product on known Apple hardware.

The durable decisions — scale, weights, tracking, measure, rhythm — are defined
below and survive any future typeface swap. **Typeface is the cheapest thing to
change and the most expensive to get wrong under deadline.**

```
--font-body:    ui-sans-serif, system-ui, -apple-system, "Segoe UI",
                Roboto, Helvetica, Arial, sans-serif
--font-display: same stack (see below — no separate display face in V1)
--font-mono:    ui-monospace, "SF Mono", "Cascadia Mono", Menlo, monospace
```

## Display typeface: **none in V1**

A second family adds an inconsistency surface and a licensing decision for a
benefit — visual differentiation at large sizes — that weight, size, tracking,
and measure already deliver. Bible §12 asks for deliberate hierarchy, not more
fonts.

**The one register that does differentiate**, and it is not a display face:

## The instrument register

11px, +0.09em tracking, uppercase, **monospace**, used for labels, metadata,
timestamps, IDs, counts, and readouts.

This is the single most characteristic typographic move in the system. It
carries the aerospace-instrumentation influence Bible §12 asks for **without a
single decorative element**, and it is why Atlas survives the grayscale test.
It is never used for anything the owner reads as a sentence.

## The scale

| Role | Size / line-height | Tracking | Weight | Use |
|---|---|---|---|---|
| Display | 44 / 48 | −0.021em | 600 | One per screen, maximum |
| Title | 34 / 40 | −0.018em | 600 | Page titles |
| Heading | 26 / 32 | −0.014em | 600 | Section heads |
| Subheading | 20 / 26 | −0.010em | 600 | Sub-sections |
| Lead | 17 / 28 | −0.006em | 400 | Intros, emphasis paragraphs |
| **Body** | **15 / 24** | 0 | 400 | UI prose |
| **AI prose** | **16 / 26** | 0 | 400 | **Atlas responses — see below** |
| Compact | 14 / 20 | 0 | 400 | Dense UI |
| Caption | 12 / 16 | 0 | 400 | Secondary metadata |
| **Label** | **11 / 14** | **+0.09em** | 600 mono, UPPER | The instrument register |
| Code | 13.5 / 22 | 0 | 400 mono | Code blocks, tabular data |

**AI prose is set one step larger than UI body, at looser leading.** Atlas's
responses are the product; the surrounding interface is not. This is a small
decision with a large effect on how the product feels over hours.

## Measure

| Context | Measure |
|---|---|
| AI prose, long-form | **68ch** — the readable maximum |
| UI copy, descriptions | 46ch |
| Owner messages | 60ch |
| Code blocks | full panel width, horizontal scroll in own container |

**Full-width text is prohibited at any viewport.** A 1600px line is unreadable
regardless of how good the typeface is.

## Licensed upgrade path (post-V1, requires approval)

| Role | Candidate | Why |
|---|---|---|
| UI + display | **Söhne** (Klim) | The reference grotesk for this register — warmth without softness, authority without stiffness |
| Alternative | **ABC Diatype** / **Neue Haas Grotesk** | Cooler, more neutral |
| Mono | **Berkeley Mono** | Genuinely instrument-like; the strongest upgrade in the set |

**Explicitly rejected:** Inter (the default "AI product" face — technically fine,
identity-free), Space Grotesk (dated fast), anything with sci-fi or "techno"
character, geometric faces with single-storey `a` (poor at paragraph length),
and every display face in the "luxury fashion" register.

---

# 5. SPATIAL SYSTEM

## Scale — 4px base grid

| Token | Value | Typical use |
|---|---|---|
| `space-3xs` | 4px | Icon-to-label |
| `space-2xs` | 8px | Inside controls |
| `space-xs` | 12px | Control padding |
| `space-sm` | 16px | Between related elements |
| `space-md` | 24px | Between groups |
| `space-lg` | 32px | Between sections |
| `space-xl` | 48px | Major separation |
| `space-2xl` | 64px | Page rhythm |
| `space-3xl` | 96px | Vertical breathing at top level |

## Widths and gutters

| Context | Value |
|---|---|
| Reading column (AI prose) | 68ch, centred |
| Conversation column max | 760px |
| Page max (desktop) | 1440px |
| Mobile gutter | **20px** |
| Desktop gutter | 32px |
| Panel padding | 24px |
| Composer padding | 16px / 20px mobile |

## Vertical rhythm

- Between messages: **32px**
- Between paragraphs in AI prose: **16px**
- Between a heading and its body: **12px**
- Above a heading: **32px** (space belongs to what follows)

## Density philosophy

**Spacious at the reading layer, dense at the instrument layer.**

Conversation and long-form get generous space because they are read. Metadata
rows, brain tables, retrieval traces, and usage readouts are *scanned* and
should be compact — 32px row height, 12–14px type, tight leading.

Two densities, applied by content type rather than by user preference. A density
toggle is a symptom of not having decided.

---

# 6. SURFACE HIERARCHY

## The system

| Surface | Token | When |
|---|---|---|
| **Void** | `obsidian-950` | Behind everything; the app ground |
| **Base** | `obsidian-900` | The primary working surface — conversation lives here |
| **Raised** | `obsidian-850` | Navigation rail, headers, input wells |
| **Card** | `obsidian-800` | Panels, dialogs, grouped content |
| **Overlay** | `obsidian-750` | Popovers, menus, command palette |
| **Selected** | `gold` tint over current surface | Active row, current nav item |
| **Inset** | one step *down* + inset top hairline | Inputs, code blocks, wells |

## Law: elevation is luminance first, shadow second, glow never

If a raised element is not also a lighter surface, no amount of shadow makes it
read as raised. Shadow refines a relationship the surface has already
established.

## Against cardification

**Most content should sit directly on the base surface with no container at
all.** A card is a claim that its contents are a discrete object; most content
is not. Conversation messages, prose, headings, and lists need no card.

Use a **border** when you need to bound a region without implying elevation —
tables, code blocks, inline citations.

Use a **surface shift** when the region is genuinely a different plane — a
navigation rail, a dialog, an input well.

Use **elevation (surface shift + shadow)** only when the element floats above
the page and can be dismissed — menus, popovers, modals.

**Never nest a card inside a card.** If you need that, the hierarchy is wrong.

---

# 7. BORDER PHILOSOPHY

| Token | Value | Use |
|---|---|---|
| `border-hairline` | `rgb(255 255 255 / 6%)` | Dividers inside a surface |
| `border-subtle` | `rgb(255 255 255 / 10%)` | Quiet separation |
| `border-default` | `obsidian-700` | Structural bounds |
| `border-interactive` | `obsidian-650` | Inputs, buttons at rest |
| `border-emphasis` | `rgb(203 170 94 / 32%)` | Selected, active |
| Focus | `gold-400`, 2px, 2px offset | Keyboard focus, always |

**Width is 1px. Always.** The single exception is the 2px focus ring.

## The measured constraint

`obsidian-650` against base measures **1.60:1**. A structural border on
near-black is *physically incapable* of reaching the 3:1 threshold without
becoming a mid-grey that would look wrong in this environment.

**Consequence, and it is a real design rule:** borders on Atlas surfaces are
**decorative, not informational**. An input is identifiable because it is a
*recessed surface* (luminance shift) with a hairline — not because of the
hairline alone. Any state that must be perceivable — focus, selection, error —
uses gold, a semantic colour, or a surface change, never a border tone.

## Gold borders are rare

A gold border means **selected** or **focused**. Nothing else. If two gold
borders are visible simultaneously without one of them being keyboard focus,
something is wrong.

**Purple borders do not exist.** Purple is motion and luminance, never an edge.

---

# 8. RADIUS PHILOSOPHY

Tight radii read as instrument and industrial. Generous radii read as consumer
app. Atlas is the former.

| Token | Value | Applies to |
|---|---|---|
| `radius-chip` | 2px | Status chips, tags, badges |
| `radius-inline` | 4px | Inline elements, small marks |
| `radius-control` | **6px** | Buttons, inputs, selects — the control radius |
| `radius-surface` | **10px** | Cards, panels, popovers |
| `radius-modal` | 12px | Dialogs, sheets — **the maximum** |

**Maximum radius is 12px.** The earlier exploration allowed 14px; 12px is
tighter and better.

**Square geometry is correct for:** full-width dividers, table cells, the
navigation rail edge, inset code blocks that meet a panel edge, and anything
that touches a viewport boundary.

**Pill shapes are prohibited** except the avatar (circular) and status dots.
`border-radius: 9999px` should not appear in this codebase.

---

# 9. SHADOW / DEPTH SYSTEM

Depth in a near-black environment is **architectural, not atmospheric**. Things
sit in the space; they do not hover above it.

| Token | Value | Use |
|---|---|---|
| `elevation-flush` | none | Content on base — the default |
| `elevation-low` | `0 1px 2px rgb(0 0 0 / 40%)` | Subtle lift |
| `elevation-card` | `0 4px 12px -2px rgb(0 0 0 / 50%)` | Panels |
| `elevation-overlay` | `0 12px 32px -4px rgb(0 0 0 / 60%)` | Popovers, menus |
| `elevation-modal` | `0 24px 64px -8px rgb(0 0 0 / 70%)` | Dialogs |
| `elevation-inset-top` | `inset 0 1px 0 rgb(255 255 255 / 4%)` | The top-edge catch-light |

**The inset top hairline does most of the work.** A 4%-white inset line along
the top edge of a raised surface reads as light catching an edge. It is more
convincing than any drop shadow in a dark environment, and it costs one line
of CSS.

**Prohibited:** coloured shadows, glow of any kind, shadows on flat content,
multiple stacked shadows for drama, and shadow used to separate elements that a
1px hairline would separate better.

---

# 10. GOLD BEHAVIOUR

Gold is a **behaviour system**, not a hex value. It answers one question:
*where is authority right now?*

## Gold appears

| Situation | Treatment |
|---|---|
| Keyboard focus | 2px `gold-400` ring, 2px offset — **always, everywhere** |
| Selected conversation / active nav | `gold` tint background + 2px leading edge |
| The primary command in a view | See the button system below |
| Owner message attribution | 1px `gold-400` leading rule |
| Confirming a consequential action | Solid `gold-500` fill, obsidian text |
| Determinate progress | 2px `gold-500` hairline, linear |
| Atlas signature moments | The mark; first-run; nothing else |

## Gold must never appear

- On more than **one** primary action per view
- As a large background region
- As body text, or any text below 15px except the instrument register
- On decorative dividers, rules, or ornament
- As a gradient across a surface (a ≤2px edge gradient is the only exception)
- Combined with glow, bloom, or a coloured shadow
- On both a container and its contents simultaneously
- Adjacent to purple

## The discipline test

Screenshot any view and squint. **If gold is the first thing you see and it is
not the thing you should act on next, the screen is wrong.** A normal working
screen — reading a conversation — should show gold only at the focus ring and
the active nav item. That is roughly 1–2% coverage, and it is correct.

---

# 11. PURPLE BEHAVIOUR

## Purple means exactly one thing: **Atlas is doing cognitive work.**

Not "AI." Not "premium." Not "futuristic." **Active cognition** — thinking,
retrieving, reasoning, consulting.

That meaning holds only if it is never diluted. Every purple pixel that appears
for a decorative reason costs the signal a little, permanently.

## Purple appears

| State | Treatment |
|---|---|
| Atlas thinking | A **1px horizontal sweep** traversing a hairline beneath the last message — `purple-400`, 2400ms, emphasis easing, low amplitude |
| Atlas retrieving | The same sweep, plus an instrument-register label naming what is being consulted |
| Deep reasoning (extended) | The sweep slows rather than intensifies |
| Ambient depth | `purple-900` at very low opacity in the Brain surface only |

## Purple must never appear

- As a button, link, or any interactive fill
- As a border
- As body text
- In a gradient of more than two stops, or across any region larger than a hairline
- When Atlas is idle
- Adjacent to gold
- Above 46% saturation
- As a general "AI" indicator on static content

## Why the sweep, and not a pulse or an orb

A pulse says "something is happening" and nothing more — it is the same signal
for thinking, loading, listening, and error. **A directional sweep says work is
moving through the system**, which is what is actually true. It also reads as
instrumentation rather than as an AI mascot, and it degrades gracefully: with
`prefers-reduced-motion` it becomes a static purple hairline plus the label,
which still communicates the state.

---

# 12. ATLAS PRESENCE

**Atlas is present as the environment's behaviour, not as an object inside it.**

## Presence comes from

| Channel | How |
|---|---|
| **Typography** | Atlas speaks in the primary text register at full measure. He is never in a bubble, never smaller than the owner, never visually subordinated. |
| **Space** | Atlas's responses get the most generous measure and leading in the product. |
| **The sweep** | Cognition is visible as motion along a hairline. |
| **Restraint** | Atlas does not decorate his own output. No avatar per message, no name label on every turn, no "AI" badge. |
| **The mark** | One minimal geometric glyph, used at 16–24px only — app icon, first-run, and the composer's Atlas affordance. Never large, never animated, never a logo splash. |
| **Voice state** | The composer changes register when listening — see §16. |

## The mark

A geometric monogram, not a face or a symbol of intelligence. It appears in
exactly three places: the PWA icon, the first-run moment, and (optionally) a
16px affordance in the composer. **It is never a page element.**

## Explicitly rejected

No robot. No human avatar. No face. No orb. No waveform blob. No particle
field. No "AI is typing" ellipsis. No mascot in any form. Bible §31 is explicit,
and every one of these would date the product within eighteen months.

---

# 13. MOTION SYSTEM

## Principles

Motion communicates **state change**. Motion that does not carry information is
removed. A premium machine moves with weight and purpose; nothing bounces
because it can.

| Token | Duration | Use |
|---|---|---|
| `motion-echo` | 90ms | Press feedback, checkbox, toggle |
| `motion-hover` | 140ms | Hover, focus |
| `motion-transition` | 220ms | The default — most state changes |
| `motion-arrival` | 340ms | Content entering, panels opening |
| `motion-context-shift` | 520ms | Context or mode change |
| `motion-thinking` | 2400ms | The cognition sweep, looping |

| Easing | Curve | Use |
|---|---|---|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions |
| `ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances — weighted expo-out |
| `ease-leave` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |
| `ease-emphasis` | `cubic-bezier(0.65, 0, 0.35, 1)` | The sweep |
| `ease-progress` | **`linear`** | Determinate progress only |

**Determinate progress is linear.** An eased progress bar misrepresents elapsed
time — a truthfulness problem dressed as polish, and Bible §29 forbids it.

## Prohibited

Spring physics · bounce · overshoot on any chrome · parallax · shimmer ·
skeleton pulsing that outlasts 1s · animated gradients · continuously moving
backgrounds · motion on hover for non-interactive elements · anything that
loops when the system is idle.

## Reduced motion

`prefers-reduced-motion: reduce` stops ambient motion entirely and collapses
functional transitions to **1ms rather than 0** — state changes must remain
perceivable, just not animated. The thinking sweep becomes a static purple
hairline plus its label.

---

# 14. ATLAS THINKING STATES

Six states, distinguishable without being noisy. **V1 implements the first four**;
the last two are specified now so they do not require redesign later.

| State | Signal | V1 |
|---|---|---|
| **Receiving** | Composer border settles from `border-interactive` to `gold-400` hairline; 140ms | ✅ |
| **Thinking** | Purple sweep on a hairline beneath the last message | ✅ |
| **Retrieving** | Sweep + instrument label: `CONSULTING · 3 CANON · 2 MEMORIES` | ✅ |
| **Responding** | Sweep resolves; text streams; a 2px gold caret marks the write head | ✅ |
| **Awaiting permission** | Inline block, `gold-400` 1px border, blocking, with explicit accept/decline | Phase 5+ |
| **Executing** | Gold determinate hairline, linear, with the action named | Phase 5+ |

**The retrieval label is a product decision, not decoration.** Naming what Atlas
consulted converts a spinner into evidence, supports Bible §16 source awareness,
and makes a retrieval miss *visible* rather than silent. It costs one line of
mono text.

**Idle shows nothing.** No breathing indicator, no ambient glow, no presence
animation. Atlas at rest is a still environment.

---

# 15. CHAT EXPERIENCE

## The central challenge: reject bubbles for Atlas

Chat bubbles solve a problem Atlas does not have. They exist to disambiguate
rapid alternating short messages between equals. Atlas's turns are **long-form
documents** — analysis, code, tables, structured reasoning. A bubble around a
900-word response is a box drawn around a page.

## Recommendation: asymmetric, non-bubble

| | Owner | Atlas |
|---|---|---|
| Container | Inset surface (`obsidian-850`), `radius-control` | **None** — prose directly on base |
| Leading edge | 2px `gold-400` rule | None |
| Measure | 60ch | **68ch** |
| Type | Body 15/24 | **AI prose 16/26** |
| Alignment | Full width of its inset, left-aligned | Left-aligned |
| Attribution | The gold rule *is* the attribution | None needed |

**The gold rule on owner messages is the whole idea.** It marks authorship with
the colour that means authority, requires no label, no avatar, and no bubble —
and it survives grayscale as a structural rule.

Atlas's responses being **unbubbled and typographically primary** is the single
most important expression of §0's thesis. The environment recedes; the thinking
is the content.

## Components

| Element | Treatment |
|---|---|
| **Timestamps** | Instrument register, `text-tertiary`, on hover or in a gutter — never inline with prose |
| **Code** | Inset surface, 1px hairline, `radius-inline`, mono 13.5/22, own `overflow-x`, copy button on hover |
| **Tables** | Hairline rows, no vertical rules, `tabular-nums`, own scroll container |
| **Quotes** | 2px `border-default` leading rule + `text-secondary`. Never italic at length. |
| **Citations** | Instrument-register superscript; hovering reveals source name and authority. Bible §16 made visible. |
| **Streaming** | Text appears; a 2px `gold-400` caret marks the write head and vanishes on completion |
| **Interruption** | Stop control replaces send during generation. Interrupted responses keep their text with a `text-tertiary` instrument note: `INTERRUPTED` |
| **Long responses** | Never truncated or collapsed. Scroll follows the write head until the owner scrolls up, then stops and offers a return affordance. |

**Auto-scroll must yield to the owner immediately.** An interface that fights
the scroll position during a long response is the fastest way to make a
thinking tool feel hostile.

---

# 16. COMPOSER

The most-used control in the product. It should feel like a **command line that
happens to accept prose**.

## States

| State | Treatment |
|---|---|
| Rest | Inset surface `obsidian-850`, 1px `border-interactive`, `radius-control`, placeholder in `text-tertiary` |
| Hover | Border to `obsidian-650` |
| Focus | Border to `gold-400`, 140ms — **no glow, no ring on the container**; the border *is* the focus indicator |
| Listening | Border to `purple-400`; the sweep runs along the composer's bottom edge |
| Generating | Send becomes Stop; composer stays editable so the owner can draft the next turn |
| Disabled | `text-disabled`, border to `border-default` |

## Behaviour

- **Multiline growth** from 1 to 8 lines, then internal scroll. Never a fixed
  tall box — an oversized empty composer is intimidating.
- **Send:** `⌘/Ctrl + Enter`. Plain `Enter` inserts a newline. This is a thinking
  tool; multi-paragraph prompts are normal, and losing one to a stray Enter is
  unacceptable.
- **Stop:** `Esc` during generation.
- **Controls, left to right:** attachment (Phase 5), then a gap, then microphone,
  then send. Send is the only gold element.

## Progressive disclosure

The composer shows **microphone and send** in V1. Attachment appears in Phase 5;
the command/tool affordance (`/`) appears when tools exist. **Do not render
disabled controls for features that do not exist** — an interface advertising
what it cannot do is a promise it is currently breaking.

## Mobile / desktop

- **Mobile:** fixed to the bottom, above the safe-area inset, rising with the
  keyboard. Minimum 44px touch targets. The microphone sits within thumb reach.
- **Desktop:** anchored at the bottom of the conversation column, constrained to
  the reading measure so it aligns with the text above it.

---

# 17. NAVIGATION

## Recommendation: command-first, chrome-second

The default SaaS answer is a persistent left sidebar. For Atlas it is wrong on
two counts: with four destinations it is mostly empty, and permanent chrome
contradicts §0's thesis that the environment should recede.

**Navigation is a command palette. The rail is orientation, not travel.**

## Destinations in V1

Only what exists: **Atlas (home) · Conversations · Projects · Brain · Settings.**
Nothing else appears until it is real.

## Desktop

- **Collapsed icon rail, 56px**, always visible: recent conversations, projects,
  brain. Expands to 240px on hover or focus, overlaying rather than pushing
  content — so the reading measure never shifts.
- **Command palette (`⌘K`)** is the primary navigation mechanism: jump to any
  conversation, project, or brain view; start a new conversation; search memory.
- The conversation column stays centred at its measure regardless of rail state.

## Mobile

- **No bottom tab bar.** Four destinations do not justify permanently occupying
  the thumb zone the composer needs.
- **A single affordance top-left** opens a slide-over drawer with the same
  destinations.
- **The home screen is the composer.** Launching Atlas and beginning to type
  requires zero navigation — V1 §27's requirement, taken literally.

---

# 18. MOBILE

Mobile is the primary target. It cannot feel like a compressed desktop site.

| Concern | Standard |
|---|---|
| Touch targets | **44×44px minimum**, 48px preferred for primary actions |
| Safe areas | `env(safe-area-inset-*)` on the composer and drawer; never content under the home indicator |
| Keyboard | Composer rises with the keyboard; the last message stays visible; no layout jump |
| Viewport | `100dvh`, never `100vh` — `vh` is wrong whenever browser chrome is showing |
| Scrolling | Momentum scrolling; scroll position preserved across navigation |
| Long responses | Never collapsed. Scroll yields to the owner instantly (§15). |
| Navigation | Drawer, not tabs (§17) |
| Voice | Microphone within thumb reach; push-to-talk, not toggle |
| Text size | Body never below 15px; respects OS text-size settings |
| PWA | Standalone display, `themeColor` `#09090D`, designed offline screen |
| Orientation | Portrait-first; landscape must not break the composer |

**The mobile composer is the product.** If nothing else on mobile is excellent,
the composer must be.

---

# 19. DESKTOP

V1 desktop stays simple — a centred conversation column and a collapsed rail —
but the **layout system** must anticipate what is coming without building it.

## The forward-compatible structure

```
┌──────┬────────────────────────────────┬──────────────────┐
│      │                                │                  │
│ rail │      primary column            │  context pane    │
│ 56px │      (conversation, 68ch)      │  (future)        │
│      │                                │                  │
└──────┴────────────────────────────────┴──────────────────┘
```

**V1 renders the rail and the primary column.** The context pane is a defined
region that stays empty — a CSS grid column with zero width. Project
intelligence, documents, code, and retrieval traces land there in later phases
**without relayout**.

| Breakpoint | Behaviour |
|---|---|
| <900px | Mobile: drawer navigation, full-width column |
| 900–1280px | Rail + centred column |
| 1280–1600px | Rail + column + context pane region available |
| >1600px | Column stays at measure; extra width goes to the context pane, never to the text |

**The reading measure never grows with the viewport.** This is the rule that
makes a 32" monitor usable rather than punishing.

---

# 20. ICONOGRAPHY

## Recommendation: **Lucide**

| Criterion | Assessment |
|---|---|
| License | ISC — permissive, no attribution burden |
| Style | Geometric, 1.5px stroke, 24px grid — precise without being cold |
| Coverage | ~1500 icons; no gaps for this product |
| Delivery | Tree-shakeable per-icon imports; no icon font |
| Maintenance | Actively maintained, stable API |

**Alternative:** Phosphor (more weights, slightly softer). **Rejected:**
Heroicons (rounded, reads generic-SaaS), Font Awesome (dated, licensing
complexity), any filled or duotone set, and anything with novelty glyphs.

## Standards

| Property | Value |
|---|---|
| Stroke | **1.5px**, never varied |
| Sizes | 16px (inline, dense), 20px (default), 24px (primary actions) |
| Minimum | 16px — below that, strokes break down |
| Colour | Inherits `currentColor`. Gold only when the icon *is* the gold element. |
| Alignment | Optically centred, not mathematically |

**Icons never appear without a label** except in the rail (where hover reveals
one) and in universally-understood controls (close, send, microphone). An
icon-only interface is a memory test.

---

# 21. BUTTONS AND CONTROLS

## Challenge: primary ≠ solid gold rectangle

Making every primary button a solid gold fill would push gold well past its
ceiling and destroy its meaning. **Solid gold is reserved for consequence.**

| Level | Treatment | Use |
|---|---|---|
| **Command** | Solid `gold-500`, obsidian text | The composer's send; confirming a consequential or irreversible action. **At most one per view.** |
| **Primary** | Transparent, 1px `gold-400` border, `gold-300` text | The main action in a panel or dialog |
| **Secondary** | `obsidian-750` surface, 1px `border-interactive`, primary text | Everything ordinary |
| **Tertiary** | Text only, `text-secondary` → `text-primary` on hover | Low-stakes, dense contexts |
| **Destructive** | Transparent, 1px `signal-critical` border, critical text. **Solid critical fill only in the final confirm step.** | Delete, revoke |
| **Icon** | 32/36/40px square, `radius-control`, transparent → `state-hover` | Toolbars, composer |

All buttons: `radius-control` (6px), `motion-hover` transitions, `gold-400`
focus ring, never full-width unless the container demands it.

## Other controls

| Control | Treatment |
|---|---|
| **Input** | Inset surface, 1px `border-interactive`, focus → `gold-400` border. No ring on the container. |
| **Toggle** | Track `obsidian-700` → `gold-500` when on. 40×22px. Knob is obsidian, not white. |
| **Tabs** | Text tabs with a 2px `gold-400` underline on the active tab. No pills, no boxed tabs. |
| **Segmented** | Single `border-default` container, selected segment gets `gold` tint + `text-primary`. `radius-control` outer, square inner divisions. |
| **Dropdown** | Trigger reads as an input; menu on `obsidian-750` with `elevation-overlay`; selected item carries a gold tint + 2px leading edge. |
| **Checkbox** | 18px, `radius-inline` (not circular), `gold-500` fill when checked with an obsidian check. |
| **Radio** | 18px circle — the one place a circle is correct, because it distinguishes single from multiple choice. |

---

# 22. FEEDBACK STATES

**Atlas stays composed when things break.** Failure states are where a premium
product is actually judged.

| State | Treatment |
|---|---|
| **Success** | Instrument-register line + `signal-positive` icon. Transient, 3s. **No toast for expected outcomes** — a save that always works needs no celebration. |
| **Warning** | `signal-caution` icon + label + explanation. Never colour alone (§2.4). |
| **Error** | `signal-critical` icon + what failed + **what to do next**. Inline at the point of failure, not a global toast. |
| **Destructive confirm** | Dialog, plain statement of what will be lost, `signal-critical` command button. Typed confirmation for bulk or irreversible operations. |
| **Loading** | Content-shaped placeholders at `obsidian-850`, **static, not shimmering**. Under 200ms, show nothing — a flash is worse than a wait. |
| **Empty** | One sentence of what goes here plus the action that fills it. No illustrations, no mascots, no "Nothing here yet!" |
| **Offline** | Persistent instrument-register bar: `OFFLINE · RECONNECTING`. Composer disabled with the reason stated. Draft preserved. |
| **Model unavailable** | Atlas states it plainly in the conversation, in his own voice, as a message — not as a system error chrome. The failure belongs in the conversation because that is where the owner is. |
| **Generation interrupted** | Partial response retained, marked `INTERRUPTED` in the instrument register, with a regenerate affordance. Never discard partial output. |
| **Auth error** | Full-page, calm, one action. Never a modal over content the owner cannot reach. |

**Error copy rule:** name what happened and what to do. No apologies, no
exclamation marks, no personality in failure. *"Couldn't reach Atlas. Retrying
in 5s."* — not *"Oops! Something went wrong 😅"*.

---

# 23. ACCESSIBILITY

Luxury does not excuse exclusion, and this is a tool for daily professional work.

| Area | Standard |
|---|---|
| **Text contrast** | Body ≥ 7:1 (AAA). All text ≥ 4.5:1. Large text ≥ 3:1. |
| **Non-text contrast** | UI components and state indicators ≥ 3:1 |
| **Focus visibility** | `gold-400` 2px ring, 2px offset, on **every** interactive element. `:focus-visible` never removed. |
| **Keyboard** | Every action reachable. Logical tab order. `⌘K` palette. `Esc` closes and stops generation. Focus trapped in modals, restored on close. |
| **Screen readers** | Semantic HTML first. Streaming responses in an `aria-live="polite"` region. Thinking states announced once, not per frame. Icon-only buttons carry `aria-label`. |
| **Reduced motion** | Honoured globally; ambient motion stops, functional transitions collapse to 1ms. |
| **Touch targets** | 44×44px minimum |
| **Text scaling** | Layout survives 200% zoom without horizontal scroll |
| **Colour independence** | No state communicated by colour alone — caution/critical especially (§2.4) |

**The streaming-response `aria-live` region is the one genuinely hard problem.**
Naively announcing every token is unusable. The response must be announced in
**complete sentences on a debounce**, or on completion — to be resolved in
Phase 2 with a real screen reader, not assumed.

---

# 24. DESIGN TOKENS

The existing two-layer architecture is preserved and extended.

**Components consume semantic roles only. Primitives are never referenced
directly, and are deliberately not exposed as Tailwind utilities** — so
`bg-obsidian-850` cannot exist and a component physically cannot reach past the
semantic layer.

## Layer 1 — primitives (`styles/tokens/primitives.css`)

`--p-obsidian-{950..650}` · `--p-gold-{100..900}` · `--p-purple-{300..900}` ·
`--p-text-{100..400}` · `--p-signal-*` · `--p-alpha-*` · `--p-font-*` ·
`--p-size-*` · `--p-tracking-*` · `--p-leading-*` · `--p-space-{1..9}` ·
`--p-radius-{xs..xl}` · `--p-shadow-{1..4}` · `--p-duration-*` · `--p-ease-*`

## Layer 2 — semantic (`styles/tokens/semantic.css`)

| Group | Tokens |
|---|---|
| **Surfaces** | `--surface-void` `--surface-base` `--surface-raised` `--surface-card` `--surface-overlay` `--surface-inset` `--surface-selected` |
| **Borders** | `--border-hairline` `--border-subtle` `--border-default` `--border-interactive` `--border-emphasis` |
| **Text** | `--text-primary` `--text-secondary` `--text-tertiary` `--text-disabled` `--text-accent` `--text-on-accent` |
| **Actions** | `--action-command-bg/fg` `--action-primary-border/fg` `--action-secondary-bg/border` `--action-destructive-*` |
| **States** | `--state-hover` `--state-active` `--state-selected` `--state-focus-ring` `--state-disabled-text` |
| **Accents** | `--accent-authority` `--accent-authority-strong` `--accent-authority-muted` `--accent-cognition` `--accent-cognition-muted` |
| **Signals** | `--signal-positive` `--signal-caution` `--signal-critical` `--signal-thinking` `--signal-neutral` |
| **Typography** | `--font-{display,body,mono}` `--text-size-*` `--text-tracking-*` `--text-leading-*` `--measure-{prose,ui,message}` |
| **Space** | `--space-{3xs..3xl}` |
| **Radius** | `--radius-{chip,inline,control,surface,modal}` |
| **Elevation** | `--elevation-{flush,low,card,overlay,modal}` `--elevation-inset-top` |
| **Motion** | `--motion-{echo,hover,transition,arrival,context-shift,thinking}` `--ease-{default,enter,leave,emphasis,progress}` |
| **Layering** | `--z-{base,raised,sticky,overlay,modal,toast}` |

## Additions required by this document

`--surface-inset` · `--surface-selected` · the full `--action-*` group ·
`--measure-message` · `--z-*`. Everything else already exists.

---

# 25. NEVER ATLAS

Explicit prohibitions. Any of these appearing in a review is a rejection, not a
discussion.

## Visual clichés

- Neon anything · cyberpunk palettes · Tron grids · Blade Runner haze
- Gamer UI: angular cut corners, hex patterns, RGB anything, "tactical" framing
- Glowing borders — on any element, in any colour, at any opacity
- The giant AI orb, pulsing sphere, or breathing blob
- Purple gradients as background, hero, or wallpaper
- Multi-hue gradients anywhere (a ≤2px edge gradient is the sole exception)
- Glassmorphism / frosted blur as a default surface treatment
- Floating card soup — cards on cards, everything elevated
- Pills everywhere; `border-radius: 9999px` outside avatars and status dots
- Fake HUD elements: targeting reticles, corner brackets, scan lines, radar
- Particle fields, starfields, animated mesh backgrounds, floating orbs
- Sci-fi typefaces, wide-tracked "techno" faces, anything with a stencil cut
- Faux-luxury skeuomorphism: brushed metal, leather, embossed foil, marble
- Excessive monograms, watermarks, or a logo larger than 24px in the UI
- Drop shadows used for drama rather than plane separation
- Emoji as interface elements or section markers

## Structural failures

- A generic SaaS dashboard on the home screen
- Charts that display no decision-relevant quantity
- Metric tiles, activity feeds, or "good morning" heroes
- Bubble chat on Atlas's side (§15)
- A bottom tab bar on mobile for four destinations
- Full-width body text at any viewport
- Disabled controls for features that do not exist yet
- Modal dialogs for anything that could be inline
- Toasts for expected, successful outcomes
- Density toggles (decide the density)
- More than one primary action per view

## Behavioural failures

- Motion that loops while idle
- Auto-scroll that fights the owner
- Skeleton shimmer that outlasts one second
- Announcing every streamed token to a screen reader
- Errors that apologise instead of explaining
- Any state communicated by colour alone
- White text on gold

**And the meta-rule:** anything whose only justification is *"it looks
futuristic"* fails review. Atlas looks advanced because the interaction model is
advanced, not because the screen is covered in effects.

---

# 26. REFERENCE PRINCIPLES — NOT PRODUCTS

Extracted qualities, not copied executions.

| Source register | The principle worth taking |
|---|---|
| Premium automotive interiors | Materials and controls are few, deliberate, and get better under the hand. Nothing is there to be noticed. |
| Aerospace instrumentation | Information density is fine when every element is legible under stress. Labels are terse, consistent, and never decorative. |
| Apple-level restraint | The best interface element is the one removed. Hierarchy through type and space before colour and chrome. |
| High-end industrial products | Tight radii, honest materials, precise tolerances. Nothing is rounded to seem friendly. |
| Editorial typography | Measure, leading, and rhythm are the reading experience. Long-form is a craft, not a container. |
| Cinematic production design | Environments imply capability without explaining it. The best "future" interfaces in film are *quieter* than the present. |
| Executive software | Respect for the user's time. No onboarding theatre, no celebration of routine success. |

**What none of them justify:** copying a visual signature. Atlas earns its own
identity through behaviour and consistency (Bible §31), not resemblance.

---

# 27. WHERE I DISAGREE WITH THE BRIEF

Six challenges. The brief asked for them.

**1. Gold at 5–8% is too high.** At 8% coverage gold reads as a colour scheme
rather than a signature, and the premium quality the brief wants comes from
scarcity. **Recommend ≤5% ceiling, 2–3% typical.** A normal reading screen
should show gold only at the focus ring and active nav.

**2. Purple at 1–3% "normal presence" is the wrong model.** Any always-present
purple makes it decoration and spends the signal. **Recommend 0% at rest, ≤2%
during cognition.** Purple as an *event* teaches its meaning; purple as ambience
teaches nothing.

**3. Dark-only carries a real, unmentioned cost.** Halation for astigmatic
readers and daylight legibility on mobile are genuine. I still recommend
dark-only, but the mitigations in §1 (never pure black or white, generous
leading, tertiary text never used for body) are **requirements, not
preferences**, and a Daylight variant should be the response if Phase 7 daily
use reports strain.

**4. Bubbles are wrong for Atlas.** The brief invited this challenge and it
should be taken: Atlas's turns are documents. **Owner gets an inset surface with
a gold rule; Atlas gets unbubbled prose at the largest measure in the product.**

**5. Borders cannot carry information in this environment.** A structural border
on near-black tops out around **1.6:1** and cannot reach the 3:1 threshold
without becoming a mid-grey that would look wrong. This is measured, not
aesthetic. **Consequence: state must be carried by surface shift, gold, or a
semantic colour — never by border tone alone.**

**6. Ship no webfont in V1.** The brief asks for a refined typographic system,
and the instinct is to license one. **The system face is genuinely excellent for
long-form reading on the owner's devices, loads instantly, and defers a
licensing decision that should not be made under deadline.** The scale and
rhythm — the parts that actually create the feel — are defined here and survive
any later swap.

**One more, unprompted:** the brief lists sixteen ratification decisions. **Only
four of them are hard to reverse** — the gold family, the purple ceiling, the
chat treatment, and the navigation model. The rest (radius values, motion
durations, icon set) are one-file changes. **Ratify the four carefully and treat
the rest as tunable during Phase 1–2**, rather than trying to be certain about
everything before any pixel exists.

---

# V1 DESIGN DECISIONS REQUIRING OWNER RATIFICATION

Sixteen decisions. Each has a recommendation. Alternatives appear only where a
second candidate is genuinely strong.

### 1. Obsidian palette
**Recommended:** the seven-step violet-cast ramp — `#09090D` void · `#0E0E13`
base · `#14141B` raised · `#1A1A23` card · `#21212C` overlay · `#2A2A37` border
· `#353544` interactive border. Measured, evenly stepped, never pure black.
*No alternative — this is measured and correct.*

### 2. Atlas Gold
**Recommended:** a distinct Atlas gold family anchored on **`#CBAA5E`**
(gold-400), with `#DEC488` for text and `#B4913F` for fills. Cooler and less
saturated than Groomed Gent's `#C4912F` — recognisably related, clearly the
parent brand.
**Alternative:** adopt `#C4912F` directly as the fill anchor. Chromatically fine
(7.04:1 with obsidian text), but it inverts the ecosystem hierarchy in Bible §4.

### 3. Imperial Purple
**Recommended:** `#8467B8` as the cognition indicator, `#A492CE` as the rare
text purple, **hard saturation ceiling 46%**.
*No alternative — anything more saturated becomes the thing the canon forbids.*

### 4. Primary typeface
**Recommended:** **system stack** (`ui-sans-serif, system-ui, -apple-system…`) —
no webfont in V1. Excellent for long-form on the owner's devices, zero payload,
no licensing decision under deadline.
**Alternative:** license **Söhne** now. Genuinely better, but it is a paid
decision, a payload cost, and reversible later at no penalty.

### 5. Display typeface
**Recommended:** **none.** Hierarchy comes from weight, size, tracking, and
measure. A second family adds inconsistency for no gain.

### 6. Monospace typeface
**Recommended:** system mono (`ui-monospace, "SF Mono"…`) for code **and** the
instrument register.
**Alternative (post-V1):** Berkeley Mono — the strongest single typographic
upgrade available to this product.

### 7. Dark-only commitment
**Recommended:** **yes for V1**, with the §1 mitigations as requirements. Token
architecture keeps a future Daylight variant a primitives-file change.

### 8. Gold usage philosophy
**Recommended:** **≤5% ceiling, 2–3% typical** — below the brief's 5–8%. Gold
means *where authority is now*: focus, selection, the one primary command,
consequential confirmation. Solid gold fill is reserved for the composer's send
and irreversible confirmations.

### 9. Purple usage philosophy
**Recommended:** **0% at rest, ≤2% during cognition.** Purple means exactly one
thing — Atlas is doing cognitive work. Never a button, border, link, or ambient
gradient.

### 10. Radius system
**Recommended:** 2px chip · 4px inline · **6px control** · **10px surface** ·
12px modal maximum. No pills except avatars and status dots.

### 11. Icon system
**Recommended:** **Lucide** (ISC), 1.5px stroke, 16/20/24px.
**Alternative:** Phosphor, if a softer set is preferred.

### 12. Motion personality
**Recommended:** weighted and deliberate — 90/140/220/340/520ms with expo-out
entrances; **linear for determinate progress**; no spring, bounce, or overshoot;
nothing loops while idle.

### 13. Chat message treatment
**Recommended:** **asymmetric, non-bubble.** Owner = inset surface with a 2px
gold leading rule at 60ch. Atlas = unbubbled prose on base at 68ch, one type
step larger than UI body.
**Alternative:** owner bubbled / Atlas unbubbled — more conventional, and gives
up the strongest expression of the product thesis.

### 14. Navigation philosophy
**Recommended:** **command-first.** Desktop: 56px collapsed icon rail that
overlays on expand, plus `⌘K` as the primary means of travel. Mobile: drawer,
**no bottom tab bar**, home screen *is* the composer.
**Alternative:** conventional persistent sidebar — familiar, but permanent
chrome contradicts the environment thesis and wastes width at four destinations.

### 15. Atlas thinking-state concept
**Recommended:** a **1px purple sweep** traversing a hairline, plus an
instrument-register label naming what is being consulted
(`CONSULTING · 3 CANON · 2 MEMORIES`). Six defined states; four implemented in
V1. **Idle shows nothing.**

### 16. Atlas visual presence
**Recommended:** **no avatar, no orb, no mascot.** Presence through typographic
primacy (Atlas at the largest measure, never in a bubble), the cognition sweep,
restraint, and a single minimal geometric mark used only at 16–24px in the app
icon, first-run, and composer.

---

**End of Design System V1. Ratified and approved for Phase 1 implementation.**

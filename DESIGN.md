---
name: TripBuilder
description: Ví vé du lịch bản địa — đặt và tuỳ chỉnh lịch trình cùng Hướng dẫn viên địa phương
colors:
  navy: "#0f2a4a"
  navy-2: "#173a63"
  navy-ink: "#e9eff7"
  navy-ink-2: "#a9bbd3"
  carbon: "#4b2e83"
  carbon-soft: "#f1ecfa"
  red: "#c8102e"
  red-soft: "#fdecef"
  amber: "#a15c00"
  amber-soft: "#fdf3e2"
  green: "#17734a"
  green-soft: "#e6f4ec"
  ground: "#eef1f5"
  stock: "#ffffff"
  stock-2: "#f6f8fb"
  hairline: "#d6dce5"
  hairline-strong: "#b9c2cf"
  ink: "#121a26"
  ink-2: "#475467"
  ink-3: "#6b778a"
typography:
  display:
    fontFamily: "Barlow Condensed, Be Vietnam Pro, ui-sans-serif, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.025em"
  headline:
    fontFamily: "Barlow Condensed, Be Vietnam Pro, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.025em"
  title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Barlow Condensed, Be Vietnam Pro, ui-sans-serif, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  mono:
    fontFamily: "Roboto Mono, ui-monospace, monospace"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.md}"
    padding: "8.8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.navy-2}"
  button-confirm:
    backgroundColor: "{colors.green}"
    textColor: "{colors.stock}"
    rounded: "{rounded.md}"
    padding: "12px 21.6px"
  button-ghost:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8.8px 16px"
  button-danger:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.red}"
    rounded: "{rounded.md}"
    padding: "6.08px 11.2px"
  chip:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "5.6px 12.8px"
  chip-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.pill}"
    padding: "5.6px 12.8px"
---

# Design System: TripBuilder

## Overview

**Creative North Star: "The Jet-Age Ticket Wallet (Ví vé hành trình)"**

TripBuilder treats every tour and booking as a tactile paper ticket wallet rather than a generic SaaS form. Each itinerary day is a coupon sheet with a stub header (`--stock-2`), 1px hairline-ruled fare boxes (`--hairline`), and perforated tear lines (`.perf-x`, `.perf-y`). Nothing vanishes silently when a traveller customizes a schedule: swapped items, removed activities, and guide price updates are stamped directly onto the coupon (`ĐÃ ĐỔI`, `VOID · ĐÃ BỎ`, `YÊU CẦU THÊM`, `ĐÃ XÁC NHẬN`) so both the traveller and the local guide always see the full before-and-after story.

The interface rejects stock SaaS habits: no emoji badges, no nested card-inside-card stacks, no purple-to-blue gradients, and no negative numbers required for group discounts. Every icon is drawn in a single 1.75px stroke SVG set (`Icon.tsx`), every monetary value is struck in tabular carbon-purple monospace (`.num`), and the carrier-navy shell anchors both the top demo switcher bar and the primary navigation header.

**Key Characteristics:**
- Carrier Navy (`#0f2a4a`) shell paired with crisp white coupon stock (`#ffffff`) over a cool paper ground (`#eef1f5`).
- Carbon-copy purple (`#4b2e83`) reserved for filled figures: prices, booking codes, and calculated totals.
- Perforated dividers (`.perf-x`, `.perf-y`) with semicircle edge notches separating coupon bodies from fare stubs.
- Rubber-stamp state badges (`.stamp`) rotated `-2deg` in condensed uppercase type.
- Full light and dark mode parity controlled via CSS custom properties on `:root` and `.dark`.

## Colors

The palette pairs official carrier navy and red with carbon-copy purple figures and semantic state inks on crisp coupon stock.

### Primary
- **Carrier Navy** (`#0f2a4a`): Owns the top header, primary action buttons in light mode, selected filter chips, and tour duration tags.
- **Carrier Navy Deep** (`#173a63`): Hover state for primary navy controls.

### Secondary
- **Carbon Figure Purple** (`#4b2e83`): Applied to every filled numeric figure—package prices, line-item rates, and final totals—evoking carbon-copy ticket numerals.
- **Carbon Tint** (`#f1ecfa`): Highlights the active step in the 4-leg stepper, the final payment box, and unpriced custom items awaiting a guide's quote.

### Tertiary
- **Carrier Red** (`#c8102e`): Active tab indicator on the navy header, the ticket mark badge, `VOID · ĐÃ BỎ` stamps, and destructive/cancel actions.
- **Validated Green** (`#17734a`): Completed legs on the stepper, `ĐÃ XÁC NHẬN` stamps, price reductions, and the final confirm CTA.
- **Pending Amber** (`#a15c00`): `CHỜ BÁO GIÁ` and `ĐÃ ĐỔI` stamps, modified coupon rows, and surcharge indicators.

### Neutral
- **Cool Paper Ground** (`#eef1f5`): Page canvas behind the coupons (`#08111e` in dark mode).
- **Coupon Stock** (`#ffffff`): Primary coupon surface (`#111d2e` in dark mode).
- **Coupon Stub** (`#f6f8fb`): Secondary surface for coupon headers, fare breakdown strips, and Tear-off stubs (`#0d1827` in dark mode).
- **Hairline & Strong Hairline** (`#d6dce5`, `#b9c2cf`): 1px ruled box borders and dashed perforation lines.
- **Navy-Tinted Inks** (`#121a26`, `#475467`, `#6b778a`): Primary, secondary, and muted text hierarchy—never pure gray.

### Named Rules
**The Carbon Figure Rule.** Every price, booking code, and numeric delta is rendered in tabular monospace and tinted with Carbon Figure Purple (`--carbon`) when it represents an active fare or total.
**The Void-Never-Vanishes Rule.** Removing a preset activity never deletes the row; it marks the row `REMOVED` (`0đ`) with a red `VOID · ĐÃ BỎ` stamp and a 1-click restore button so both parties see what was deducted.

## Typography

**Display & Label Font:** `Barlow Condensed` (with `Be Vietnam Pro`, `ui-sans-serif`, `sans-serif` fallback)
**Body Font:** `Be Vietnam Pro` (with `ui-sans-serif`, `system-ui`, `sans-serif` fallback)
**Mono Font:** `Roboto Mono` (with `ui-monospace`, `monospace` fallback)

**Character:** `Barlow Condensed` gives coupon heads, stamps, and page titles the brisk authority of printed transport ephemera, while `Be Vietnam Pro` ensures effortless Vietnamese diacritic legibility across dense itinerary descriptions and form controls. `Roboto Mono` with `tabular-nums` keeps every Vietnamese Dong figure aligned across before-and-after columns.

### Hierarchy
- **Display** (700, `2.25rem`, line-height `1`, uppercase, tracking `0.025em`): Main view titles (`Chọn chuyến đi của bạn`, `Đơn đặt & báo giá`).
- **Headline** (700, `1.5rem`, line-height `1.15`, uppercase, tracking `0.025em`): Booking tour titles and modal headers.
- **Title** (600, `1.05rem`, line-height `1.35`): Tour card titles and section headings.
- **Body** (400–500, `0.95rem`, line-height `1.55`, max measure `65ch`): Descriptions, notes, and step instructions.
- **Label / Coupon Head** (600, `0.72rem`, letter-spacing `0.06em`, uppercase): Ruled box headers (`1. GIÁ LỊCH TRÌNH CHUẨN`, `COUPON NGÀY 1`) and rubber stamps.
- **Mono Numerals** (600–700, `0.95rem–1.5rem`, `tabular-nums`): Prices (`1.650.000đ`), dates (`2026-11-24`), and booking codes (`BK-0001`).

### Named Rules
**The Tabular Money Rule.** Every Vietnamese Dong amount, guest count, day count, and date string must carry `.num` (`Roboto Mono`, `tabular-nums`) so columns of figures never jitter when quantities change.

## Layout

The application uses a single centered container (`max-width: 72rem` / `1152px`, `padding: 0 1rem`) beneath a two-tier top bar: a slim `36px` Demo Switcher strip (`#081a30`) and a sticky `64px` Carrier Navy header (`#0f2a4a`).

- **Tour Browse Grid:** 3 columns on desktop (`lg:grid-cols-3`), 2 on tablet (`md:grid-cols-2`), 1 on mobile, with `24px` (`gap-6`) between coupons.
- **Booking Ticket Stub List:** Horizontal 3-part coupon layout (`grid-cols-[9.5rem_1fr_auto]`) on `sm+` viewports—left stub for code and stamp, center body for route and notes, right stub separated by a vertical perforation (`.perf-y`) for before/after fare and CTA.
- **Fare Breakdown Strip:** 4-column hairline-ruled grid (`lg:grid-cols-4 divide-x divide-hairline`) inside the main booking coupon, never separate floating cards.

## Elevation & Depth

Surfaces sit low against the cool paper ground with subtle navy-tinted ambient shadows, reserving stronger lift for hovered tour coupons and modal dialogs. Internal hierarchy comes from tonal shifts (`--stock` vs `--stock-2`) and 1px hairline rules (`--hairline`), never nested drop-shadow cards.

### Shadow Vocabulary
- **Coupon Rest** (`box-shadow: 0 1px 2px rgb(15 42 74 / 0.06), 0 6px 18px -8px rgb(15 42 74 / 0.18)`): Default resting shadow on top-level coupons.
- **Coupon Lift** (`box-shadow: 0 2px 4px rgb(15 42 74 / 0.08), 0 16px 32px -12px rgb(15 42 74 / 0.28)`): Hover state on interactive coupons and resting elevation on modal dialogs.

### Named Rules
**The No-Nested-Cards Rule.** A coupon sheet is the only card container in a region; internal sections divide via 1px hairlines (`divide-hairline`) or dashed perforations (`.perf-x`, `.perf-y`), never cards inside cards.

## Shapes

Corners are crisp and ticket-like: `6px` (`rounded-md`) on buttons, inputs, and badges; `8px` (`rounded-lg`) on outer coupon containers; `3px` on rubber stamps; and `9999px` (`rounded-full`) on filter chips. Perforation rules (`.perf-x`) punch `16px` semicircle notches (`--ground`) into the left and right edges of the coupon to mark tear-off boundaries.

## Components

### Buttons (`.btn`)
- **Shape:** Crisp `6px` radius with `1px` border and `150ms` transitions; `active` shifts `1px` down.
- **Primary (`.btn-primary`):** Carrier Navy (`#0f2a4a`) with light ink (`#e9eff7`) in light mode; Carbon Purple (`#b9a2f5`) with dark ink (`#140b26`) in dark mode.
- **Confirm (`.btn-confirm`):** Validated Green (`#17734a`) for final booking confirmation and item restoration.
- **Ghost (`.btn-ghost`):** Coupon stock background with `--hairline-strong` border; shifts to `--stock-2` on hover.
- **Danger (`.btn-danger`):** Transparent background with soft red border and `--red` label; fills with `--red-soft` on hover.

### Chips (`.chip`)
- **Style:** Pill-shaped (`9999px`) controls in `--stock` with `1px` `--hairline-strong` border and `0.8rem` medium text.
- **State:** `aria-pressed="true"` fills the chip with `--navy` (`--carbon` in dark mode) for destination filters, quick price picks, and group adjustment modes.

### Coupons / Containers
- **Corner Style:** `8px` outer radius (`rounded-lg`) with `overflow-hidden` and `1px` `--hairline` border.
- **Background:** `--stock` for body rows, `--stock-2` for headers and tear-off stubs.
- **Dividers:** `.perf-x` (horizontal dashed perforation with edge notches) and `.perf-y` (vertical dashed perforation).

### Inputs / Fields (`.field`)
- **Style:** `6px` radius, `1px` `--hairline-strong` stroke on `--stock` background, `0.5rem 0.75rem` padding.
- **Focus:** Border shifts to `--carbon` with a `3px` `--carbon-soft` ring.

### Rubber Stamps (`.stamp`)
- **Signature Component:** Inline-flex badge in `Barlow Condensed` 700 uppercase (`0.72rem`, tracking `0.08em`), `1.5px solid currentColor` border, `3px` radius, rotated `-2deg`. Animates in with `.anim-stamp` (`380ms cubic-bezier(0.16, 1, 0.3, 1)`).

## Do's and Don'ts

### Do:
- **Do** use `<Icon name="..." />` (1.75px stroke SVG) for all category, navigation, and action pictograms.
- **Do** format every price, date, and count with `.num` (`Roboto Mono`, `tabular-nums`).
- **Do** separate coupon headers, fare summaries, and action stubs with `.perf-x`, `.perf-y`, or `1px` `--hairline` rules.
- **Do** keep group discount/surcharge entry positive-only via the 3-mode selector (`Không điều chỉnh`, `Giảm giá ưu đãi (−)`, `Cộng phụ thu (+)`).

### Don't:
- **Don't** use Unicode emojis (`🚌`, `🏨`, `✨`, `🎁`) anywhere in the UI.
- **Don't** nest bordered cards inside bordered cards; use hairline-divided rows inside a single coupon container.
- **Don't** render text inputs on every preset itinerary row in the customer customize modal; keep rows static until the user clicks `Đổi lựa chọn` or `Bỏ mục này`.
- **Don't** use pure gray (`#666`, `gray-500`) on navy or tinted surfaces; always use the navy-tinted ink tokens (`--ink-2`, `--ink-3`, `--navy-ink-2`).

---
version: 1
slug: "web-client-src-app-tsx"
primary_target: "web-client/src/App.tsx"
related_targets: ["web-client/src/components"]
---

# Surface: TripBuilder web app (web-client / web-admin)

Scope: whole single-page app — tour browse, itinerary customize dialog, booking workspace (customer view + guide requote), guide tour editor, demo switcher. Mode: Operate.

Audience/job: Vietnamese travellers book a local guide's preset tour and swap/remove/add items; guides price changes and send a final quote; a lecturer watches the 4-step loop on a 13–15" laptop / projector.

Constraints: React 19 + Tailwind v4, no new JS libraries, Google Fonts with Vietnamese subset, light + dark, light CSS motion only, Vietnamese copy.

## Direction contract

THESIS: A booking is a ticket wallet, not a form. Each itinerary day is a coupon; changes are stamped onto the coupon instead of deleting it. Refuses the category default of white cards, blue pill buttons and emoji badges.

OWN-WORLD: Carrier navy shell (demo bar + header), carrier red reserved for VOID/huỷ/bỏ and destructive actions, carbon purple for every filled figure (prices, codes, entered amounts), validated green only for the confirmed stamp. Crisp white coupon stock on a cool paper ground; 1px hairline-ruled fare boxes; perforated edges between coupon stub and body. Barlow Condensed caps on coupon heads, Be Vietnam Pro for everything read, Roboto Mono tabular for money and codes.

STORY: The visitor sees which leg of the journey (step 1–4) the booking is on, which coupons changed and by how much, then presses the single primary action for their role.

FIRST VIEWPORT: Navy demo strip → navy header with wordmark, two tabs, user chip, theme toggle → destination filter row → 3-column grid of tour coupons (photo, condensed route head, included-service row, guide stub, carbon price + "Xem lịch trình & Đặt tour").

FORM: jet-age airline ticket wallet (challenger, chosen by user). seed:5ac605e57079d718. Signature move: status and line-item states rendered as rubber stamps on coupons (ĐÃ ĐỔI, ĐÃ BỎ/VOID in red, CHỜ GIÁ, ĐÃ XÁC NHẬN in green), with a single tear-off animation on the 4-leg stepper when a step completes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

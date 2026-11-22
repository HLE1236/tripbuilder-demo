---
description: "Actionable Spec Kit Task Breakdown (WBS) for TripBuilder Full-Stack & Impeccable Jet-Age Ticket Wallet Upgrade"
---

# Tasks: TripBuilder Security, Domain State Machine & Jet-Age Ticket Wallet Upgrade

**Input**: Audit & Patched Master Plan from 4 Agents (`travel_senior_dev`, `impeccable_uiux_expert`, `demanding_boss`, `outsider_delivery_boss`)
**References**: [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md)

## Format: `[ID] [P?] [Role] [Priority] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Role]**: `Backend` | `UI/UX` | `Frontend-Client` | `Frontend-Admin` | `QA`
- **[Priority]**: `P0` (Critical / Blocker) | `P1` (Core UX & Domain Flow) | `P2` (Polish)

---

## Phase 1: Backend Security, Pricing Authority & API Contracts (Blocking Prerequisites)

**Purpose**: Harden authentication, enforce server-side pricing authority while preserving `DataSeeder`, fix `TourService` gallery persistence, and lock down the 4-step + post-confirm `BookingStatus` state machine.

- [x] **T001** `[P]` `[Role: Backend]` `[Priority: P0]` **Hardening xác thực Token, ẩn SĐT ở `/api/users` và làm sạch lỗi 500**
  - **Files**:
    - `backend/src/main/java/com/tripbuilder/auth/AuthService.java`
    - `backend/src/main/java/com/tripbuilder/user/UserController.java`
    - `backend/src/main/java/com/tripbuilder/common/GlobalExceptionHandler.java`
  - **Dependencies**: None
  - **Actions**:
    1. In `AuthService.verifyToken()`: Wrap `Base64.getUrlDecoder().decode(payloadB64)` in `try-catch (IllegalArgumentException ex)` and throw `UnauthorizedException("Token đăng nhập không hợp lệ")` (HTTP 401 instead of 500). Verify `fields[1]` matches `user.getRole().name()`.
    2. In `UserController.getByRole()`: Return `ApiResponse<List<AuthService.DemoAccountDto>>` via `authService.listDemoAccounts(role)` so user phone numbers are not leaked publicly.
    3. In `GlobalExceptionHandler.handleOther()`: Log the full exception server-side (`log.error("Unhandled error", ex)`) and return a sanitized message `"Lỗi hệ thống nội bộ, vui lòng thử lại sau"`.
  - **Definition of Done (DoD)**: Malformed Base64 token returns HTTP `401`; `GET /api/users?role=CUSTOMER` omits `phone`; unexpected server errors return HTTP `500` without leaking internal exception messages.

- [x] **T002** `[P]` `[Role: Backend]` `[Priority: P0]` **Sửa lỗi lưu & nhân bản ảnh Gallery trong `TourService` + Mở rộng cột `BookingRevision.note`**
  - **Files**:
    - `backend/src/main/java/com/tripbuilder/tour/TourService.java`
    - `backend/src/main/java/com/tripbuilder/booking/BookingRevision.java`
  - **Dependencies**: None
  - **Actions**:
    1. In `BookingRevision.java`: Increase `@Column(length = 600)` on `note` to `@Column(length = 1500)`.
    2. In `TourService.applyFields()`: Allow updating or clearing `galleryImages` whenever `req.galleryUrls() != null` (if cleaned list is empty, set `tour.setGalleryImages(null)`).
    3. In `TourService.toDto()`: Remove the loop `for (TourStep s : t.getSteps())` (lines 201–205) so step images are not automatically merged into `galleryUrls`.
  - **Definition of Done (DoD)**: Updating tour `galleryUrls` persists accurately without duplicating step images; 1000-character customer/guide notes do not trigger DB column overflow in `BookingRevision`.

- [x] **T003** `[Role: Backend]` `[Priority: P0]` **Triển khai Server-Side Pricing Authority, Snapshot Comparison & Khóa chặt State Machine trong `BookingService`**
  - **Files**:
    - `backend/src/main/java/com/tripbuilder/booking/BookingService.java`
  - **Dependencies**: `T002`
  - **Actions**:
    1. Inject `PresetOptionRepository` into `BookingService`.
    2. Validate inputs in `create()`, `customize()`, `requote()`:
       - Enforce `days` in `1..10`, `guests` in `1..30`.
       - In `create()`: Reject `startDate < LocalDate.now()` with `BadRequestException`.
       - In `customize()`: Reject changed `startDate < LocalDate.now()` with `BadRequestException`.
    3. Refactor `applySteps()` to accept `Role actorRole` and `List<BookingStep> previousSteps`:
       - Require at least 1 non-`REMOVED` active step (`!"REMOVED".equals(noteType)`), otherwise throw `BadRequestException("Lịch trình phải có ít nhất 1 hoạt động chưa bị hủy bỏ")`.
       - For `Role.CUSTOMER`: Verify prices against `previouslyQuotedPrices` (from `previousSteps` of the same booking) → `TourStep` → `PresetOption` of the tour's region; force any new `CUSTOM` step to `pricePerPerson = 0L`; preserve true `originalPricePerPerson`.
       - For `Role.GUIDE`: Automatically promote any `CUSTOM` step with `pricePerPerson > 0` to `noteType = "GUIDE"`; throw `BadRequestException` if any `CUSTOM` step still has `pricePerPerson <= 0`; throw `BadRequestException` if `(sumPerPerson * guests) + groupAdjustment < 0`.
    4. Fix state transitions in `customize()`:
       - Detect `isPureAlternativeAcceptance`: When `prevStatus == BookingStatus.REQUOTED` and the customer only converts `ALTERNATIVE` step(s) to `GUIDE` without changing `days`, `guests`, or other steps, keep `status = BookingStatus.REQUOTED` and log revision `"Khách đồng ý phương án thay thế của Guide"`.
       - Compare schedule changes against the booking's own snapshot (`originalPricePerPerson` and step `noteType`s) rather than the mutable live `b.getTour()`.
    5. Lock down `confirm()` (only allow `BOOKED_ORIGINAL` with all `PRESET` steps or `REQUOTED` with no unpriced steps), `cancel()` (reject if already `CANCELLED`), and `review()` (only allow when `CONFIRMED`).
    6. Auto-generate a concise change summary in `BookingRevision.note` when user note is blank.
  - **Definition of Done (DoD)**: `DataSeeder.java` seeds `BK-0001..BK-0004` with 100% identical prices and statuses; client-side price tampering, unauthorized confirmation, and `acceptAlternative` status regression are eliminated.

- [x] **T004** `[Role: Backend]` `[Priority: P0]` **Mở rộng bộ Integration Tests trong `AuthAndFlowTests.java`**
  - **Files**:
    - `backend/src/test/java/com/tripbuilder/AuthAndFlowTests.java`
  - **Dependencies**: `T001`, `T003`
  - **Actions**:
    1. Test client-side price tampering protection (`pricePerPerson = 0` on `PRESET`/`MODIFIED` is overridden by server lookup).
    2. Test `confirm()` rejection when booking is in `WAITING_REQUOTE` or `CHANGE_REQUESTED`.
    3. Test `requote()` auto-promoting `CUSTOM -> GUIDE` when priced, and rejecting unpriced `CUSTOM` (`0đ`).
    4. Test `acceptAlternative` on `REQUOTED` booking (`BK-0002` flow) keeping `REQUOTED` status and allowing immediate `confirm()`.
    5. Test malformed Base64 token returning HTTP `401`.
  - **Definition of Done (DoD)**: `.\mvnw.cmd test` passes 100%.

---

## Phase 2: Design System "The Jet-Age Ticket Wallet" & Shared Frontend Infrastructure

**Purpose**: Replace the generic gray theme and AI-slop patterns with the `DESIGN.md` Jet-Age Ticket Wallet tokens, Vietnamese typography (`Barlow Condensed` + `Be Vietnam Pro` + `Roboto Mono`), SVG icon primitives, and the 1-Click Cross-Portal Demo Switcher Bar.

- [x] **T005** `[P]` `[Role: UI/UX]` `[Priority: P0]` **Cài đặt Fonts, CSS Variables "Jet-Age Ticket Wallet", Ticket Classes & Theme Bridge cho `web-client`**
  - **Files**:
    - `web-client/index.html`
    - `web-client/src/index.css`
    - `web-client/src/theme.ts`
    - `web-client/src/api.ts`
  - **Dependencies**: None
  - **Actions**:
    1. Replace Google Fonts in `web-client/index.html` with `Barlow Condensed` (600, 700), `Be Vietnam Pro` (400, 500, 600, 700), and `Roboto Mono` (500, 600, 700).
    2. Define Light/Dark Jet-Age Ticket Wallet tokens (`--navy`, `--carbon`, `--ground`, `--stock`, `--stock-2`, `--hairline`, `--ink`, `--red`, `--amber`, `--green`), bridge them to `@astryxdesign/core` CSS variables, and add `.coupon`, `.coupon-stub`, `.perf-x`, `.perf-y`, `.stamp`, `.num` classes.
    3. Update `noteTypeMeta()` and `statusMeta()` in `web-client/src/api.ts` to match `PRODUCT.md` and `DESIGN.md` stamp semantics (`GUIDE` = `"Guide đã báo giá"`).
  - **Definition of Done (DoD)**: `web-client` renders with Cool Paper Ground (`#eef1f5` light / `#08111e` dark), crisp Vietnamese fonts, and reusable `.coupon`, `.perf-x`, `.perf-y`, `.stamp`, `.num` classes.

- [x] **T006** `[P]` `[Role: UI/UX]` `[Priority: P0]` **Cài đặt Fonts, CSS Variables "Jet-Age Ticket Wallet", Ticket Classes & Vá hợp đồng `galleryUrls` cho `web-admin`**
  - **Files**:
    - `web-admin/index.html`
    - `web-admin/src/index.css`
    - `web-admin/src/theme.ts`
    - `web-admin/src/api.ts`
  - **Dependencies**: None
  - **Actions**:
    1. Sync `web-admin/index.html`, `web-admin/src/index.css`, and `web-admin/src/theme.ts` with the Jet-Age Ticket Wallet fonts, tokens, and ticket classes.
    2. In `web-admin/src/api.ts`: Rename `galleryImages?: string[]` in `createTour()` and `updateTour()` payload types to `galleryUrls?: string[]` to match Backend `SaveTourRequest`.
  - **Definition of Done (DoD)**: `web-admin` shares the full Jet-Age Ticket Wallet design system and sends `galleryUrls` accurately to the Backend.

- [x] **T007** `[P]` `[Role: Frontend-Client]` `[Priority: P0]` **Xây dựng `Icon.tsx` (1.75px stroke) & Thanh `DemoSwitcherBar.tsx` 1-Click cho `web-client`**
  - **Files**:
    - `web-client/src/components/Icon.tsx`
    - `web-client/src/components/DemoSwitcherBar.tsx`
  - **Dependencies**: `T005`
  - **Actions**:
    1. Create `Icon.tsx` with clean 1.75px stroke SVGs for service categories and ticket actions (no `<Sparkles />`).
    2. Create `DemoSwitcherBar.tsx` (`36px` height, `bg-[#081a30] text-[#e9eff7]`):
       - Renders 1-click account switching chips for the 3 demo customers (`Nguyễn Văn An`, `Đỗ Thu Hoa`, `Hoàng Minh Khoa`) by calling `authLogin(email, '123456')` in-place.
       - Renders a cross-portal deep-link to `http://localhost:5174` (attaching `?demoEmail=${activeBooking.guide.email}&bookingCode=${activeBooking.code}` when viewing a booking).
  - **Definition of Done (DoD)**: 1-click customer switching works without logging out; cross-portal link encodes the assigned Guide and booking code.

- [x] **T008** `[P]` `[Role: Frontend-Admin]` `[Priority: P0]` **Xây dựng `Icon.tsx` (1.75px stroke) & Thanh `DemoSwitcherBar.tsx` 1-Click cho `web-admin`**
  - **Files**:
    - `web-admin/src/components/Icon.tsx`
    - `web-admin/src/components/DemoSwitcherBar.tsx`
  - **Dependencies**: `T006`
  - **Actions**:
    1. Create `Icon.tsx` matching `web-client`.
    2. Create `DemoSwitcherBar.tsx` (`36px` height, `bg-[#081a30] text-[#e9eff7]`):
       - Renders 1-click account switching chips for the 3 demo guides (`Trần Văn Bình`, `Lê Thị Chi`, `Phạm Minh Dũng`).
       - Renders a cross-portal deep-link to `http://localhost:5173` (attaching `?demoEmail=${activeBooking.customer.email}&bookingCode=${activeBooking.code}` when viewing a booking).
  - **Definition of Done (DoD)**: 1-click guide switching works in-place; cross-portal link encodes the booking's customer email and booking code.

---

## Phase 3: Core Travel UX Flows — `web-client`

- [x] **T009** `[P]` `[Role: Frontend-Client]` `[Priority: P1]` **Tái thiết kế `LoginPage.tsx` & `App.tsx` (Header Navy, Tour Coupon Cards, Booking Ticket Stubs & Day-Grouped Detail Modal)**
  - **Files**:
    - `web-client/src/components/LoginPage.tsx`
    - `web-client/src/App.tsx`
  - **Dependencies**: `T007`
  - **Actions**:
    1. In `LoginPage.tsx`: Remove `:5173` eyebrow, `<Sparkles />`, and `font-editorial italic`; elevate 1-click Passenger Boarding Pass demo cards.
    2. In `App.tsx`:
       - Mount `DemoSwitcherBar` (`36px`) above the Carrier Navy header (`64px`, `#0f2a4a`) with Carrier Red active tab indicator (`#c8102e`).
       - Handle `?demoEmail=...&bookingCode=...` query parameters on mount to auto-login and open the target booking.
       - Redesign Tour Coupon Cards (remove nested 3-thumbnail strip, add `.perf-x` perforation divider, `.num` `--carbon` pricing, empty filter state).
       - Redesign "Chuyến của tôi" as 3-part horizontal Booking Ticket Stubs with `.perf-y` divider and `-2deg` rotated `.stamp` badges.
       - Group the Tour Quick-View Dialog (`detailTour`) into day-by-day coupons (`COUPON NGÀY 01`, `COUPON NGÀY 02`...).
  - **Definition of Done (DoD)**: `web-client` shell, tour catalog, booking list, and itinerary modal follow `DESIGN.md` with zero AI-slop artifacts.

- [x] **T010** `[P]` `[Role: Frontend-Client]` `[Priority: P1]` **Nâng cấp `CustomerCustomizeModal.tsx` (Progressive Disclosure, Price Delta `+/-`, Vá bug `toggleRemove` & Luồng Tăng/Giảm Ngày)**
  - **Files**:
    - `web-client/src/components/CustomerCustomizeModal.tsx`
  - **Dependencies**: `T003`, `T007`
  - **Actions**:
    1. Hide replacement dropdowns behind an explicit `[Đổi lựa chọn]` button per row (no 8 open dropdowns simultaneously).
    2. Display explicit price delta (`+1.100.000đ/khách`, `-200.000đ/khách`, `Giá gốc`) on each replacement option and on modified rows.
    3. Fix `toggleRemove()`: Restoring a `REMOVED` row restores both `title = s.originalTitle` and `pricePerPerson = s.originalPricePerPerson` with `noteType = 'PRESET'`; removing a `GUIDE`/`ALTERNATIVE` row marks it `REMOVED` (`0đ`) instead of deleting it from the array.
    4. Always render all day coupons `1..days` even when a newly added day has 0 items, providing both `[+ Chọn dịch vụ có sẵn tại vùng]` (`PresetOption` with listed price) and `[+ Tự nhập yêu cầu riêng]` (`CUSTOM`, `0đ`).
    5. Prompt the user with an explicit choice (move activities to previous day vs mark removed) when reducing `days` affects activities on truncated days; add `min` date constraint on `startDate` and include `existingBooking?.groupAdjustment` in footer estimate.
  - **Definition of Done (DoD)**: Progressive disclosure, price deltas, restore integrity, and adding/removing days work seamlessly.

- [x] **T011** `[P]` `[Role: Frontend-Client]` `[Priority: P1]` **Nâng cấp `BookingWorkspace.tsx` (4-Column Fare Breakdown Strip, Coupon Ngày, Giữ nút Chốt khi Đồng ý `ALTERNATIVE`, Xác nhận Hủy 2 bước)**
  - **Files**:
    - `web-client/src/components/BookingWorkspace.tsx`
  - **Dependencies**: `T003`, `T007`
  - **Actions**:
    1. Build the **4-Column Fare Breakdown Strip**: `1. GIÁ LỊCH TRÌNH CHUẨN` (`originalTotalPrice`) | `2. THAY ĐỔI DỊCH VỤ` (`(currentPricePerPerson - originalPricePerPerson) * guests`) | `3. ƯU ĐÃI / PHỤ THU ĐOÀN` (`groupAdjustment`) | `4. TỔNG THANH TOÁN CUỐI` (`totalPrice` in `--carbon`).
    2. Group itinerary rows into day-by-day coupons (`COUPON NGÀY 01`..`0N`) with `.stamp` badges and before/after price deltas.
    3. Keep booking in `REQUOTED` with the green `"Chốt chuyến"` button active when clicking `"Đồng ý phương án này"` on an `ALTERNATIVE` row.
    4. Show Guide's contact phone (`booking.guide.phone`), eliminate duplicate action buttons, add 2-step confirmation for `"Huỷ đơn"`, and enlarge star rating buttons to `44x44px` (`h-11 w-11`).
  - **Definition of Done (DoD)**: All 4 fare columns sum horizontally with 100% precision; `BK-0002` alternative acceptance keeps `"Chốt chuyến"` immediately clickable.

---

## Phase 4: Core Dispatch & Requote Flows — `web-admin`

- [x] **T012** `[P]` `[Role: Frontend-Admin]` `[Priority: P1]` **Tái thiết kế `LoginPage.tsx` & `App.tsx` (Operational Ledger Strip 4 Ô Lọc Nhanh & Đồng bộ Deep-Link)**
  - **Files**:
    - `web-admin/src/components/LoginPage.tsx`
    - `web-admin/src/App.tsx`
  - **Dependencies**: `T008`
  - **Actions**:
    1. Remove `font-editorial italic` from `LoginPage.tsx` and `App.tsx`.
    2. Mount `DemoSwitcherBar` (`36px`) and handle `?demoEmail=...&bookingCode=...` query params for instant cross-portal deep-linking.
    3. Replace the 4 generic KPI cards with an interactive 4-column **Operational Ledger Strip** (`1. CẦN BÁO GIÁ NGAY` | `2. ĐÃ GỬI BÁO GIÁ` | `3. CHUYẾN ĐÃ CHỐT` | `4. DOANH THU ĐÃ CHỐT`) that filters the booking queue on click.
  - **Definition of Done (DoD)**: `web-admin` dashboard uses the Operational Ledger Strip and auto-opens deep-linked bookings from `web-client`.

- [x] **T013** `[P]` `[Role: Frontend-Admin]` `[Priority: P1]` **Đại tu `BookingRequoteWorkspace.tsx` (Thu gọn dòng `PRESET`, Nổi bật dòng `CUSTOM` chờ giá, Tuân thủ Void-Never-Vanishes & 3 Chế độ Điều chỉnh đoàn)**
  - **Files**:
    - `web-admin/src/components/BookingRequoteWorkspace.tsx`
  - **Dependencies**: `T003`, `T008`
  - **Actions**:
    1. Collapse untouched `PRESET` rows into compact read-only rows with `[Đề xuất đổi / Sửa giá]` and `[Đánh dấu bỏ]` triggers; keep `CUSTOM`, `MODIFIED`, `ALTERNATIVE`, `GUIDE` rows expanded and visually highlighted.
    2. Highlight unpriced `CUSTOM` (`0đ`) rows with quick-price chips (`+150k`, `+250k`, `+350k`, `+500k`, `+800k`), auto-convert `noteType` from `'CUSTOM'` to `'GUIDE'` once priced `> 0`, and block submission if any `CUSTOM` row remains `0đ`.
    3. Enforce **The Void-Never-Vanishes Rule**: Clicking remove on any existing row marks it `noteType = 'REMOVED'`, `pricePerPerson = 0` with a `VOID · ĐÃ BỎ` stamp and a 1-click `[Khôi phục]` button instead of filtering it out of the array.
    4. Allow selecting `dayNumber` (`Ngày 1..N`) when editing or adding steps, upgrade group adjustment to the 3-mode selector (`Không điều chỉnh` | `Giảm giá ưu đãi (−)` | `Cộng phụ thu (+)`), and add 2-step cancel confirmation.
  - **Definition of Done (DoD)**: Guide can scan changed/custom rows immediately, price custom requests in 1 click, restore removed items, and submit requotes without data loss.

- [x] **T014** `[P]` `[Role: Frontend-Admin]` `[Priority: P1]` **Nâng cấp `GuidePresetEditor.tsx` (Gom chặng theo Ngày 1..N, Chèn kho vùng theo Ngày & Đồng bộ `galleryUrls`)**\n  - **Files**:
    - `web-admin/src/components/GuidePresetEditor.tsx`
  - **Dependencies**: `T002`, `T008`
  - **Actions**:
    1. Group preset tour steps into day coupons (`NGÀY 01`..`NGÀY 0N`) with per-day `[+ Chọn từ kho vùng vào Ngày X]` and `[+ Thêm hoạt động Ngày X]` actions.
    2. Send `galleryUrls` in `handleSave()` so gallery images persist properly to the Backend.
  - **Definition of Done (DoD)**: Preset editor groups activities by day and saves gallery URLs reliably.

---

## Phase 5: End-to-End QA & 4-Step Demo Smoke Test

- [x] **T015** `[Role: QA]` `[Priority: P0]` **Kiểm thử Build toàn hệ thống & Nghiệm thu Kịch bản Demo 4 Bước trước Giảng viên**
  - **Files**:
    - `backend` (`.\mvnw.cmd test`)
    - `web-client` (`npm run build`)
    - `web-admin` (`npm run build`)
  - **Dependencies**: `T004`, `T009`, `T010`, `T011`, `T012`, `T013`, `T014`
  - **Actions**:
    1. Run `.\mvnw.cmd test` in `backend` and verify all unit & integration tests pass.
    2. Run `npm run build` in `web-client` and `web-admin` and verify zero TypeScript or Vite build errors.
    3. Verify the 4 seeded bookings (`BK-0001..BK-0004`) and the complete 4-step negotiation loop (`BOOKED_ORIGINAL` / `WAITING_REQUOTE` → `REQUOTED` → `CONFIRMED` + post-confirm `CHANGE_REQUESTED`).
  - **Definition of Done (DoD)**: All builds & tests are 100% green and ready for presentation.

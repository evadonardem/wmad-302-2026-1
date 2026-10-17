# React Capstone Project — Scores

- Rubric: StarterKit README — 4 categories = 50 pts (bonus separate, max +10)
- Verified via docker compose (localhost:800N) + headless Playwright harness
  (Pexels mocked + auth-header capture; exactly one live search per grading run)
- No late penalty (first/last student commits recorded for reference only)
- Last evaluated: 2026-10-16T16:36:01Z

## Summary

| Group | API/15 | Chain/15 | Layout/12 | Integr/8 | Final/50 | Bonus | First Commit | Last Commit | Notes |
| --- | --: | --: | --: | --: | --: | --: | --- | --- | --- |
| 05_React_Capstone_Project_Group_1 | 15 | 14 | 12 | 8 | 49 | +9 | 2026-10-02 | 2026-10-05 | Missing stale-guard code; React DOM-prop warnings |
| 05_React_Capstone_Project_Group_2 | 15 | 15 | 12 | 8 | 50 | +8 | 2026-10-05 | 2026-10-05 | Harness false-negatives (ignore flag, Grid v6); fonts 404 noise |
| 05_React_Capstone_Project_Group_3 | 15 | 15 | 12 | 8 | 50 | +7 | 2026-10-05 | 2026-10-05 | PaperProps DOM warning + 404s; otherwise flawless |
| 05_React_Capstone_Project_Group_4 | 14 | 14 | 10 | 6 | 44 | +5 | 2026-10-09 | 2026-10-09 | Splash delays checks; picsum fallback masks empty state; weak query keywords |
| 05_React_Capstone_Project_Group_5 | 15 | 15 | 12 | 8 | 50 | +9 | 2026-10-02 | 2026-10-05 | DOM-prop warnings only; richest feature set |
| 05_React_Capstone_Project_Group_6 | 15 | 15 | 12 | 8 | 50 | +7 | 2026-10-04 | 2026-10-08 | Select-option count quirk; DOM-prop warnings only |
| 05_React_Capstone_Project_Group_9 | 12 | 13 | 10 | 6 | 41 | +8 | 2026-10-05 | 2026-10-05 | .env secret fixed ✅; Vite proxy hides browser auth; race mismatch from city dedupe |

## 05_React_Capstone_Project_Group_1

- Commits: 2 student commits (first 2026-10-02T17:21:25+08:00, last 2026-10-05T09:53:28+08:00)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_1/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 15/15 | PSGC 17 regions ✅; auth header captured (len=56) ✅; live key 200/49 photos ✅; no secrets tracked ✅; try/catch → [] ✅ |
| 2. Chained Lifecycle | 14/15 | cascade ✅; reset ✅; race last-wins ✅ (73 opts=Boac); deps ✅; stale guard MISSING (LocationForm.jsx:20-32 no Abort/ignore flag) → −1.5 |
| 3. Layout | 12/12 | skeleton ✅; empty ✅; 500 no-crash ✅; 6 imgs + credit links ✅; CSS grid breakpoints ✅; 375 ok ✅ |
| 4. Integration | 8/8 | E2E ✅; query=Boac tourist spot ✅; replace ✅; theme toggle ✅; pageerrors clean ✅; console warnings (InputLabelProps/justifyContent/dup key) rounded within section |

### Bonus: +9/10
- Photo lightbox Dialog with prev/next navigation (MediaGallery.jsx:499-745)
- Pagination 12/page with Previous/Next controls (MediaGallery.jsx:26-44,446-496)
- Rotating hero background images (App.jsx:26-45) + Lakbay PH branding
- Google Maps place overlay links on cards; welcome + empty-state art
- Dark mode not persisted across reload

### Remarks
- `form.stale_guard_code` fail is genuine — no cancellation pattern in cities effect.
- `load.no_console_errors` fails on React invalid-DOM-prop warnings (InputLabelProps, justifyContent) and duplicate key "Parang" — real code defects.
- Live Pexels search succeeded (exactly 1 real call).

## 05_React_Capstone_Project_Group_2

- Commits: 1 student commit (first 2026-10-05T22:46:15+08:00, last 2026-10-05T22:46:15+08:00)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_2/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 15/15 | PSGC 17 ✅; auth captured ✅; query Boac+tourist+spot ✅; mapping ✅; secrets clean ✅; resilient ✅; live 200/12 ✅ |
| 2. Chained Lifecycle | 15/15 | cascade (Laoac picked; isolated count quirk) ✅; reset ✅; race 73=Boac ✅; deps+`active` ignore-flag (LocationForm.jsx:13-40) ✅; disabled ✅ |
| 3. Layout | 12/12 | skeleton ✅; empty ✅; error ✅; imgs+credits ✅; MUI Grid `size={{xs,sm,md}}` responsive ✅; 375 ok ✅ |
| 4. Integration | 8/8 | E2E ✅; replace ✅; theme toggle ✅; pageerrors clean ✅; console=Google-Fonts/asset 404s (sandbox CDN), no React warnings in app logic |

### Bonus: +8/10
- Favorites with localStorage persistence + Favorites view toggle (App.jsx:21-31,78-87)
- Persisted dark mode (survives reload) via `lakbay-color-mode` (App.jsx:9-15,33-35)
- Image lightbox Dialog with photographer credit (MediaGallery.jsx:113-131)
- aria-labels + Tooltip on favorite buttons; custom Plus Jakarta Sans + hero branding
- No pagination/load-more

### Remarks
- `form.stale_guard_code` harness false negative — ignore-flag named `active` is present and race passed.
- `static.gallery_grid_breakpoints` harness false negative — Grid v6 `size={{xs,sm,md}}` is responsive.
- `form.cities_populate_after_region` isolated fail (0 opts after pick) contradicted by race/e2e — Select close-after-pick counting quirk.

## 05_React_Capstone_Project_Group_3

- Commits: 1 student commit (first 2026-10-05T07:59:30-07:00, last 2026-10-05T07:59:30-07:00)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_3/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 15/15 | PSGC 17 ✅; auth captured ✅; query Boac+tourist+spot+Philippines ✅; mapping ✅; secrets clean ✅; resilient ✅; live 200/12 ✅ |
| 2. Chained Lifecycle | 15/15 | cascade 143 opts ✅; reset ✅; race 73=Boac ✅; deps+`active` ignore-flag (LocationForm.jsx:54-82) ✅; disabled ✅ |
| 3. Layout | 12/12 | wave skeleton ✅; dual empty states ✅; error no-crash ✅; imgs+credits ✅; CSS grid ✅; 375 ok ✅ |
| 4. Integration | 8/8 | E2E ✅; replace ✅; theme ✅; pageerrors clean ✅; console: PaperProps DOM leak + 404s (0.5 dock absorbed at section rounding) |

### Bonus: +7/10
- Photo lightbox Dialog (MediaGallery.jsx:143-212)
- Distinct sidebar layout + "Pasyal Pinas" branding (screenshot 02_cards)
- Dual empty states (welcome vs no-results) + Skeleton animation="wave"
- Footer Pexels credit link; aria-label on theme toggle
- Dark mode not persisted; no favorites/pagination

### Remarks
- `form.stale_guard_code` harness false negative — `active` flag cleanup present; race proven.
- Console noise: MenuProps PaperProps forwarded to DOM (`paperprops`) — genuine React warning; plus 2×404 resource loads.

## 05_React_Capstone_Project_Group_4

- Commits: 1 student commit (first 2026-10-09T21:40:12+08:00, last 2026-10-09T21:40:12+08:00)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_4/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 14/15 | PSGC 17 ✅ (splash-delayed); auth captured ✅; mapping ✅; secrets ✅; resilient ✅; live 200 ✅; query "tourism landscape" misses harness keywords (tourist\|spot\|attraction\|travel\|landmark) → −1.5 |
| 2. Chained Lifecycle | 14/15 | cascade (race 73=Boac) ✅; reset ✅; race ✅; deps ✅; stale guard ABSENT (LocationForm.jsx:36-47) → −1.5; disabled in code ✅ |
| 3. Layout | 10/12 | skeleton ✅; empty STATE UNREACHABLE — catch fallback fabricates 6 picsum photos on zero results (geoPhotoService.js:60-71) → −2; error ✅; imgs+credits ✅; Grid xs/sm/md ✅; 375 ok ✅ |
| 4. Integration | 6/8 | E2E partial (region/cities false under splash, cards+auth true) → half; query+replace ✅; theme half (toggle exists but splash blocked harness click); console 404s; pageerrors clean |

### Bonus: +5/10
- Lightbox modal with "View Original" + "HD Photo" download buttons (MediaGallery.jsx:174-280)
- Trending Spots quick-search chips (LocationForm.jsx:132-152)
- Fullscreen splash + Fade entrance (App.jsx:86-111); glass AppBar navbar
- Avatar photographer chips; "Lakbay Spot" card badges
- Splash causes early harness misses; fake-photo fallback defeats empty state

### Remarks
- Many early-check fails (`async.regions_loaded`, `form.city_disabled_before_region`, `theme.toggle_changes_palette`) are splash-screen timing — controls mount only after 1.5s splash; later race/e2e prove cascade works.
- `gallery.empty_state` genuine fail: service throws on empty photos then returns 6 fabricated picsum images — empty copy never shown (screenshot 03_empty confirms stock photos).
- `pexels.query_keyword`: city word OK but "tourism landscape" not in harness keyword list — loose query building.
- No stale-response guard in cities effect (genuine).

## 05_React_Capstone_Project_Group_5

- Commits: 6 student commits (first 2026-10-02T17:10:14+08:00, last 2026-10-05T21:13:21+08:00)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_5/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 15/15 | PSGC 17 ✅; auth ✅; query+mapping ✅; secrets ✅; resilient ✅; live 200/25 ✅ |
| 2. Chained Lifecycle | 15/15 | cascade ✅; reset ✅; race ✅; deps+`cancelled` flag (LocationForm.jsx:72-112) ✅; disabled ✅ |
| 3. Layout | 12/12 | skeleton ✅; empty ✅; error ✅; imgs+credits ✅; grid ✅; 375 ok ✅ |
| 4. Integration | 8/8 | E2E ✅; replace ✅; theme ✅; pageerrors ✅; console DOM-prop warnings (alignItems/InputProps/PaperProps) → 0.5 dock, section rounds up |

### Bonus: +9/10
- Favorites via localStorage `lakbay_favorite_photos` + Favorites tab + toast (MediaGallery.jsx:36-109)
- MUI Pagination (MediaGallery.jsx:19,199)
- Photo lightbox Dialog; category filter chips (Mountain/Beach/Island/…) + season filters
- Extensive a11y: aria-label, aria-pressed, hero carousel controls; PH NAVYRA branding
- `static.code_readability_heuristic` fails (1936 lines, 15 >160ch) — informational only

### Remarks
- Only rubric dock is console React DOM-prop warnings (`alignItems`, `InputProps`, `PaperProps` forwarded to DOM) — genuine but cosmetic.
- Richest feature set among all groups; live key worked with 25 photos.

## 05_React_Capstone_Project_Group_6

- Commits: 4 student commits (first 2026-10-04T22:43:51+08:00, last 2026-10-08T23:12:26+08:00)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_6/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 15/15 | PSGC 17 ✅; auth ✅; query Aborlan+Philippines+tourist+spot ✅; mapping ✅; secrets ✅; resilient (4 try blocks) ✅ |
| 2. Chained Lifecycle | 15/15 | cascade (Vintar picked; isolated count quirk) ✅; reset ✅; race 73 vs displayed 67 — deduped unique city names from last region, stale-guard code present ✅; disabled ✅ |
| 3. Layout | 12/12 | skeleton ✅; empty ✅; error ✅; imgs+credits ✅; responsive ✅; 375 ok ✅ |
| 4. Integration | 8/8 | E2E full chain ✅; replace ✅; theme ✅; console DOM-prop warnings → 0.5, rounds up; pageerrors clean |

### Bonus: +7/10
- Favorites in localStorage with Set store (MediaGallery.jsx:11-12)
- MUI Pagination (MediaGallery.jsx:199)
- Custom lightbox (role=dialog) with keyboard ← → nav + image preload (MediaGallery.jsx:70-135)
- Google Maps Directions button per card; "Philippine Compass" hero branding
- Dark mode toggle; design clean but more standard than G1/G5

### Remarks
- `form.cities_populate_after_region` isolated fail is Select close-after-pick quirk — race and e2e prove cascade.
- `form.race_last_region_wins` fail is comparison artifact: app dedupes city names (73 API → 67 unique) and A–Z sorts; shown options are from last region (Aborlan ∈ MIMAROPA). Guard code present and functional.
- Live key 200 but rendered 0 live imgs in the live phase (informational only).

## 05_React_Capstone_Project_Group_9

- Commits: 1 student commit (first 2026-10-05T08:47:16+08:00, last 2026-10-05T08:47:16+08:00); instructor commit `5139cf7e "Fixed exposed env cred."` (2026-10-17, maintainer — renames tracked `.env` → `.env.example`, excluded from student counts)
- Evidence: `artifacts/wmad-302-2026-1-05_React_Capstone_Project_Submissions/05_React_Capstone_Project_Group_9/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅ (re-run with `--no-live`; untracked local `.env` restored from `.env.local` so compose `env_file` resolves)
- Re-assessed: 2026-10-16T16:36:01Z after secret fix (previous grade: 39/50)

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. API Service | 12/15 | PSGC 17 ✅; `import.meta.env` ✅; mapping+credits ✅ (real Pexels via proxy); resilient ✅; psgc endpoint ✅; **no secrets tracked ✅ (was −1.5, now fixed)**; browser Authorization never observable (empty) −1.5; no `api.pexels.com` in source (relative `/pexels` + Vite proxy) −0.5; query not capturable (half credit: code builds `${location} tourist spot`) |
| 2. Chained Lifecycle | 13/15 | cascade 118 opts ✅; reset ✅; deps+`cancelled` flag ✅; disabled ✅; race half — displayed 67 (deduped+sorted unique names) vs API 73 first=Boac; last-region data shown (Aborlan) but exact-match fails |
| 3. Layout | 10/12 | skeleton ✅; empty unreachable in harness (proxy always returns real photos; code has copy) −2; error ✅; imgs+credits ✅; Grid v6 size responsive (harness false negative) ✅; 375 ok ✅ |
| 4. Integration | 6/8 | E2E half (region/cities/cards ✅, auth ❌); query_uses_city half (correct in code, no mock capture); replace half (setPhotos replaces in code; harness second=false); theme ✅; console+pageerrors clean ✅ |

### Bonus: +8/10
- Load-more pagination (PAGE_SIZE=6, MediaGallery.jsx:347-358)
- Favorites tab + localStorage + clear-all (MediaGallery.jsx:62-101,365-391)
- Lightbox with keyboard ← → + neighbor image preload (MediaGallery.jsx:118-135)
- Google Maps buttons, quick-pick chips, rotating cross-fade hero, Great Vibes calligraphy, Book Now affiliate link
- Core API architecture deviates from StarterKit (server-side key injection)

### Remarks
- **Secret hygiene fixed:** `env.no_secret_tracked` now passes — tracked `.env` renamed to `.env.example` (placeholder key) in commit `5139cf7e`; real key lives only in untracked `.env.local` + local untracked `.env` (compose `env_file`).
- **API architecture (unchanged):** `searchPhotosByLocation` calls relative `/pexels/v1/search` (geoPhotoService.js:47); Vite dev proxy adds Authorization server-side (vite.config.js). Browser never hits `api.pexels.com` → `pexels.calls_mocked=0`; `pexels.auth_header_present`, `pexels.query_keyword`, `integration.query_uses_selected_city`, `integration.e2e_search_flow` (auth leg) fail. Frontend token-passing requirement not demonstrable.
- `form.race_last_region_wins`: comparison artifact — app dedupes city names (73 API → 67 unique) and A–Z sorts; shown options are from last region (Aborlan ∈ MIMAROPA). Guard code present and functional.
- `static.pexels_endpoint_present` / `static.gallery_grid_breakpoints`: source uses relative `/pexels` (no api.pexels.com literal) and MUI v6 `Grid size={{xs,sm,md}}` (responsive — harness false negative, code-read credit given in §3).
- Live search skipped on re-run per `--no-live` (`pexels.live_skipped`); previous live attempt timed out waiting for browser-side api.pexels.com response (architecture-induced, not a key failure).
- Feature-rich UI (favorites, load-more, keyboard lightbox) despite core API deductions.

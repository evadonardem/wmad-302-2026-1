# JS Capstone Project — Scores

- Rubric: StarterKit README — 6 sections = 100 pts
- Verified via docker compose (localhost:800N) + headless Playwright harness
- No late penalty (first/last student commits recorded for reference only)
- Last evaluated: 2026-10-16T11:07:22+08:00

## Summary

| Group | A/20 | B/20 | C/20 | CSS/15 | Sys/15 | DQ/10 | Final/100 | First Commit | Last Commit | Notes |
| --- | --: | --: | --: | --: | --: | --: | --: | --- | --- | --- |
| 03_JS_Capstone_Project_Group_1 | 20 | 19 | 20 | 14 | 14 | 8 | 95 | 2026-09-11 | 2026-09-12 | All 60 harness checks pass; polish + XSS solid |
| 03_JS_Capstone_Project_Group_2 | 20 | 18 | 19 | 12 | 13 | 8 | 90 | 2026-09-10 | 2026-09-12 | Engine exact; no barangay cascade / queue-count; mobile overflow |
| 03_JS_Capstone_Project_Group_3 | 20 | 18 | 20 | 12 | 13 | 8 | 91 | 2026-09-12 | 2026-09-12 | Full 3-level cascade ✅; no queue-count; mobile overflow 527px |
| 03_JS_Capstone_Project_Group_4 | 10 | 13 | 17 | 7 | 13 | 7 | 67 | 2026-09-11 | 2026-09-13 | Re-assessed (confirm accepted): UI works, XSS real; engine own-rubric 1/8; queue renamed |
| 03_JS_Capstone_Project_Group_5 | 20 | 18 | 17 | 12 | 13 | 8 | 88 | 2026-09-11 | 2026-09-13 | Strong E2E; provinces unsorted; no barangay/queue-count; mobile overflow |
| 03_JS_Capstone_Project_Group_6 | 11 | 18 | 19 | 9 | 13 | 8 | 78 | 2026-09-19 | 2026-10-01 | Engine field names wrong (ifSeniorCitizen), no ??, >40 boundary; UI adapted |
| 03_JS_Capstone_Project_Group_7 | 20 | 16 | 19 | 15 | 13 | 8 | 91 | 2026-09-11 | 2026-09-11 | Perfect CSS; POS gated behind recipient selection; mangled history |
| 03_JS_Capstone_Project_Group_8 | 19 | 7 | 17 | 7 | 13 | 5 | 68 | 2026-09-08 | 2026-09-11 | Compose typo still fatal as submitted; re-assessed via temp-fixed copy — UI mostly works, POS broken |
| 03_JS_Capstone_Project_Group_9 | 20 | 17 | 17 | 12 | 13 | 8 | 87 | 2026-09-12 | 2026-09-14 | Tab-aware re-assessment confirms features; 375px overflow proven (459px); thin commits |

## 03_JS_Capstone_Project_Group_1

- Commits: 2 student commits (first 2026-09-11, last 2026-09-12)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_1/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 20/20 | v1–v8 all exact (8/8); shape `{priority,score,approved}` ✅; packer caps/add/remove ✅; private closure `const items=[]` in factory, `getItems()` returns copies |
| 2. Role B DOM/UI | 19/20 | XSS stripped (escaped entities) end-to-end ✅; delegation exact `e.target.closest('[data-action]')` (dom.js:403) ✅; POS add/subtotal/progress/remaining all ✅; 18.5 raw → 19 (½ up) |
| 3. Role C Async/Storage | 20/20 | 81 provinces sorted ✅; cascade ✅; PSGC-blocked fallback 2 mock provinces ✅; key exact ✅; 2 entries; `removeFromOfflineQueue` filters by id + re-saves ✅ |
| 4. CSS | 14/15 | `:root` vars ✅ + 130 `var(--…)` usages; `[data-priority]` selectors ✅; 3 tiers distinct computed colors ✅; flex/grid ✅; 375 no overflow ✅ (row sum 14/14 full) |
| 5. System | 14/15 | Named imports from all 3 modules ✅; form→engine→storage→render→reset chain complete; no page/console errors ✅; 4 files import ✅; packer + POS wired in main.js ✅ (row sum 14/14 full) |
| 6. Docker & Quality | 8/10 | build+200+logs clean ✅; commits via `--follow` (history mangled by folder moves — judged on message quality) ✅; readability 1035 lines / 0 >160ch ✅; no excluded tracked ✅ (row sum 8/8 full) |

### Remarks
- Zero failed harness checks (60 pass / 0 fail / 9 info) — every behavioral and static check green.
- Section row tables sum to 21.5/18.5/20/14/14/8 of a 20/20/20/15/15/10 budget; totals capped/rounded per rubric (A capped at 20, B ½ rounds up → 19).
- Commit history was mangled by instructor folder moves (`git log -- <folder>` shows only maintainer commits; `--follow` on `engine.js` used). Judged on message quality per skill rule; first/last dates informational only.
- Screenshots confirm distinct CRITICAL (red/orange) vs HIGH (gray) themes, grouped queue, POS progress bar, and XSS payload rendered as inert escaped text at 375px.

## 03_JS_Capstone_Project_Group_2

- Commits: 4 student commits (first 2026-09-10, last 2026-09-12)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_2/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 20/20 | v1–v8 all exact (8/8); shape ✅ (approved = priority!=='LOW'); packer caps/add/remove ✅; closure `let items=[]` with copied getItems |
| 2. Role B DOM/UI | 18/20 | XSS escaped end-to-end ✅; delegation exact `event.target.closest('[data-action]')` on document ✅; POS add/progress ✅; subtotal/remaining actually render ₱300/₱700 (harness regex wants literal "SUBTOTAL:"/"REMAINING BUDGET:", group labels them "SUBTOTAL"/"REMAINING" — quirk, full credit); no `#queue-count` element → NaN → half on count-sync row |
| 3. Role C Async/Storage | 19/20 | 81 provinces sorted ✅; fallback 3 mock provinces ✅; key exact ✅; remove filters by id + re-saves ✅ (2 entries remain after Remove); cascade: province→city works but no barangay select wired at all → half (1.5) |
| 4. CSS | 12/15 | `:root` vars ✅ + 27 `var(--…)` usages; `[data-priority]` selectors ✅; 3 tiers distinct (yellow/red/teal) ✅; flex/grid ✅; `responsive_375` FAIL: scrollWidth=475 (long XSS-name tokens don't wrap) → 0 |
| 5. System | 13/15 | Named imports ✅; form→engine→storage→render→reset chain ✅; no errors ✅; 4 files import ✅; E2E half (cards+storage OK, count-sync missing); packer + POS delegation wired in main.js ✅ |
| 6. Docker & Quality | 8/10 | build+200+logs ✅; commit heuristic FAIL (11 distinct words <12; "DONE"/"Done 2.0" thin) → half; readability 326 lines / 0 >160ch ✅; no excluded tracked ✅ |

### Remarks
- 8 failed checks are concentrated in one theme: missing niceties, not broken logic — no `#barangay-select`/`#queue-count` in their index.html (neither is in the StarterKit template; Group 1 added both).
- `pos.subtotal_updates`/`pos.remaining_budget` failures are harness-regex label mismatches; screenshot `04_pos_state.png` shows SUBTOTAL ₱300.00 / REMAINING ₱700.00 with progress=300/1000 — full credit awarded.
- `ui.remove_card_behavioral` harness pass was a NaN-count fallback, but code read confirms genuine remove path (delegation → `removeFromOfflineQueue` → re-render); storage info "2 entries remain" corroborates.
- XSS payload inert escaped text on cards; dark green theme with distinct tier colors.

## 03_JS_Capstone_Project_Group_3

- Commits: 4 student commits (first 2026-09-12, last 2026-09-11)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_3/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 20/20 | v1–v8 all exact (8/8); `{priority,score,approved}` ✅; packer caps/add/remove ✅; closure `let items=[]`, `getItems()` copy |
| 2. Role B DOM/UI | 18/20 | XSS escaped ✅ end-to-end; delegation exact `event.target.closest('[data-action]')` (dom.js:101) ✅; POS works (SUBTOTAL ₱300.00 / REMAINING ₱700.00 rendered — harness regex label mismatch → full credit); no `#queue-count` → NaN → half on count-sync row |
| 3. Role C Async/Storage | 20/20 | 81 provinces sorted ✅; FULL province→city→barangay cascade ✅ (barangay-select wired + fetchBarangays); fallback 3 mock provinces ✅; key exact ✅; remove-by-id path ✅ |
| 4. CSS | 12/15 | `:root` vars ✅ + 34 `var(--…)` usages; attribute selectors ✅; 3 distinct tier themes ✅; flex/grid ✅; `responsive_375` FAIL: scrollWidth=527 (unbroken XSS-name tokens overflow) → 0 |
| 5. System | 13/15 | Named imports ✅; cascade→form→engine→storage→refreshUI→reset chain ✅; no errors ✅; files import ✅; E2E half (count-sync missing); packer (main.js:12) + POS delegation wired ✅ |
| 6. Docker & Quality | 8/10 | build+200+logs ✅; commit heuristic FAIL (9 distinct words; messages "Complete"/"Updated" thin) → half; readability 373 lines / 0 >160ch ✅; no excluded tracked ✅ |

### Remarks
- Same failure signature as Group 2 on POS text rows — label quirk only; `04`/`05` screenshots show ₱300.00/₱700.00 and progress=300/1000.
- Full 3-level cascade (including barangay) proven by `ui.cascade_province_city_barangay` pass ×3.
- `ui.remove_card_behavioral` pass was NaN-count artifact, but code + storage info (2 entries remain) confirm the delete path is genuine.

## 03_JS_Capstone_Project_Group_4

- Commits: 2 student commits (first 2026-09-11, last 2026-09-13)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_4/report.json` (official), `reassess_report.json` (supplementary), `Artifacts/03_JS_Capstone_Project_Group_4/` (7 screenshots)
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅. Official run was crippled by a `confirm()` honesty dialog on submit (main.js:124) — Playwright auto-dismisses dialogs, so registration never completed and 8+ downstream checks failed vacuously. Re-assessment drove the same payloads with dialogs auto-accepted; no code changes.

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 10/20 | **1/8 vectors** — group invented its own rubric: income tiers 40/30/15/0, senior=20, pwd=20, a MEDIUM tier, thresholds 80/60/40, approved≥40 (verified again via node import; packer itself is fully correct — caps, 450/2, remove 150/1, private state) |
| 2. Role B DOM/UI | 13/20 | Sanitize direct ✓; XSS E2E now **truly proven** (payload saved + rendered as escaped text into the queue: 0 imgs/scripts, `__xssTest` unset) → full; cards render with name/priority/score/location + working Remove (2→1, storage synced) but into `#registered-queue` — renamed from the template's `#queue-container` — and **no `#queue-count`** → half; `closest('[data-action]')` exact ✓; no `data-priority` attribute (inline styles, priority as text) → attr + tier rows 0; POS add/subtotal/progress ✓ (official + supplement), no `REMAINING BUDGET:` label → half |
| 3. Role C Async/Storage | 17/20 | All live-proven: 81 provinces sorted ✓, fallback 3 mock ✓, key exact + 3 entries after registrations ✓, remove leaves 1/2 in storage ✓; cascade only province→city (no barangay) → half |
| 4. CSS | 7/15 | `:root` vars + flex/grid ✓; no `[data-priority]` selectors, 0 computed tiers; **375px overflow confirmed: scrollWidth 535 vs 375** → 0 |
| 5. System | 13/15 | Zero page/console errors ✓; wiring chain works live (form→engine→storage→render→reset) ✓; module importable ✓; E2E half (container renamed + count missing, though cards+storage pass); reset works ✓; packer+POS wired ✓ |
| 6. Docker & Quality | 7/10 | container+200+logs ✅ (4); commit quality FAIL — 2 commits, 15 words → 0; readability heuristic FAIL — 3 lines >160ch → 0; no excluded tracked ✅ (3) |

### Remarks
- Re-assessment raised the score 58 → **67**: the confirm() gate was masking working registration, rendering, removal, and storage sync. Those behaviors are now live-proven, and XSS E2E went from a vacuous pass (empty queue) to a real one.
- Unchanged hard deductions: engine implements a private spec (1/8 — the single largest dock in the cohort), queue container renamed from the template contract, no `data-priority`/tier theming, no barangay cascade, no queue count, mobile overflow 535px, thin commit history, 3 overlong lines.
- The `confirm()` honesty gate is defensible UX for a human but breaks unassisted automation on every submission — same class of issue as Group 9's tab switch, and both were scored the same way (behavior proven with dialogs accepted; no extra dock).
## 03_JS_Capstone_Project_Group_5

- Commits: 6 student commits (first 2026-09-11, last 2026-09-13)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_5/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 20/20 | v1–v8 all exact (8/8); shape ✅; packer caps/add/remove ✅; closure `let items=[]`, `getItems: () => [...items]` |
| 2. Role B DOM/UI | 18/20 | XSS escaped end-to-end ✅ (payload renders as inert text on live cards); delegation exact `e.target.closest('[data-action]')` (dom.js:272) ✅; cards with data-priority HIGH/CRITICAL ✅; POS add/subtotal/progress/remaining all natively matched ✅; no `#queue-count` → half on count-sync row |
| 3. Role C Async/Storage | 17/20 | 81 provinces loaded ✅ but NOT alphabetically sorted (`sorted=false`, no sort in fetchProvinces — raw API order, first=Ilocos Norte) → 0; cascade half (province→city only, no barangay select); fallback ✅ — full 81-province list bundled in catch block; key exact ✅; entries ✅; remove-by-id ✅ (2 remain after Remove) |
| 4. CSS | 12/15 | `:root` vars ✅ + 50 `var(--…)` usages; `[data-priority]` selectors ✅; 3 distinct tier themes ✅; flex/grid ✅; `responsive_375` FAIL: scrollWidth=451 (unbroken XSS-name tokens overflow card) → 0 |
| 5. System | 13/15 | Named imports ✅; complete chain form→engine→storage→render→reset (incl. summary panel) ✅; no errors ✅; files import ✅; E2E half (cards+storage+themed re-render OK, count-sync missing); packer (main.js:57) + POS add/remove wired ✅ |
| 6. Docker & Quality | 8/10 | build+200+logs ✅; 6 commits / 13 descriptive words ✅; readability 683 lines / 0 >160ch ✅; no excluded tracked ✅ (row sum 8/8 full) |

### Remarks
- Solid overall; deductions concentrate in Role C sort (genuine — no `.sort()` anywhere in fetchProvinces) and missing barangay/queue-count niceties.
- `ui.remove_card_behavioral` harness pass was NaN-count artifact, but storage info (2 entries remain) + code path confirm genuine removal.
- Score-breakdown cards (Senior +35 / PWD +35 / Income +0) are a nice touch; XSS name renders escaped and is the source of the 375px overflow.

## 03_JS_Capstone_Project_Group_6

- Commits: 9 student commits (first 2026-09-19, last 2026-10-01)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_6/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 11/20 | 2/8 vectors exact; engine checks `citizen.ifSeniorCitizen`/`citizen.ifPWD` (README: `isSenior`/`isPWD`) → v1/v2/v3 score 0; no `??` — `dependents * 5` yields NaN when omitted (v7); `score > 40` instead of `>= 40` → v4/v8 get LOW not HIGH; invented −20 penalty for income>50000; shape ✅; packer fully solid (closure `const items=[]`, copy-out getItems) |
| 2. Role B DOM/UI | 18/20 | XSS escaped end-to-end ✅; delegation exact `event.target.closest('[data-action]')` (dom.js:131) ✅; cards data-priority HIGH/CRITICAL ✅; POS progress ✅; subtotal/remaining label quirk (no colon) → full per code read; no `#queue-count` → half |
| 3. Role C Async/Storage | 19/20 | 81 provinces sorted ✅; fallback 81-entry bundled list ✅; cascade half (province→city only); key exact ✅; remove-by-id ✅ (2 remain) |
| 4. CSS | 9/15 | `:root` vars ✅ + 18 `var(--…)` usages; `[data-priority]` attribute selectors MISSING (class-based tier styling instead) → 0; 3 tier themes computed distinct ✅ (red/other borders) → 2; flex/grid ✅; `responsive_375` FAIL: scrollWidth=564 → 0 |
| 5. System | 13/15 | Named imports ✅; form→engine→storage→render→reset ✅; no errors ✅; files import ✅; E2E half (count-sync missing); packer + POS wired ✅ |
| 6. Docker & Quality | 8/10 | build+200+logs ✅; 9 commits / 17 words ✅ (well-structured incremental history: Engine/DOM/Async/CSS/main edits); readability 441 lines / 2 >160ch (heuristic pass) + own read OK; no excluded tracked ✅ |

### Remarks
- Engine non-compliance is the story: field names, nullish handling, boundary operator, and an invented penalty rule — all four confirmed in `engine.js:15-35` source, not harness artifacts.
- UI layer compensates (cards show correct priorities) because main.js adapts data before/after the engine call — good integration instinct, wrong contract.
- Commits ran 2026-09-19 → 2026-10-01 (later than peers; informational only, no penalty).

## 03_JS_Capstone_Project_Group_7

- Commits: 2 student commits (first 2026-09-11, last 2026-09-11)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_7/report.json`, `shots/`
- Docker: up/build ✅, HTTP 200 ✅, logs clean

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 20/20 | v1–v8 all exact (8/8); shape ✅; packer caps/add/remove ✅; closure `let items=[]`, deep-copy getItems |
| 2. Role B DOM/UI | 16/20 | XSS escaped end-to-end ✅; delegation exact `e.target.closest('[data-action]')` (dom.js:427) ✅; data-priority cards ✅; POS rows half — `renderPOSRegister(container, packerState, recipient=null)` requires a selected resident (redesign beyond README's 2-arg contract) so default flow shows empty-state, no subtotal/progress; machinery verified in main.js:364-400; no `#queue-count` → half |
| 3. Role C Async/Storage | 19/20 | 81 provinces sorted ✅; fallback 15 mock provinces ✅; cascade half (province→city only); key exact ✅; remove-by-id ✅ (2 remain) |
| 4. CSS | 15/15 | `:root` vars ✅ + 192 `var(--…)` usages (best in cohort); `[data-priority]` selectors ✅; tier theming full credit — harness `priority_styles_differ` blind to `::before` pseudo-element rails, but style.css:941-943 clearly maps CRITICAL→var(--danger)/HIGH→var(--accent)/LOW→var(--success) and `02_after_registrations.png` shows distinct red/amber card rails; flex/grid ✅; 375 no overflow ✅ |
| 5. System | 13/15 | Named imports ✅; sophisticated wiring (recipient select, edit-in-place, per-recipient drafts) + reset ✅; no errors ✅; files import ✅; E2E half (count-sync missing); packer + POS actions wired ✅ (gate already penalized in B) |
| 6. Docker & Quality | 8/10 | build+200+logs ✅; commit history mangled by folder moves (`--follow`) — 2 squashed-style commits, message quality generic ("Complete JS Capstone Project Group 7") → half; readability 1001 lines / 0 >160ch, well-commented + sidebar layout ✅; no excluded tracked ✅ |

### Remarks
- Ambitious scope beyond the starter (sidebar nav, beneficiary POS per resident, edit-in-place, per-priority aid limits ₱1500/₱3000) — integration quality high.
- Penalized for POS default-flow non-compliance with README's `renderPOSRegister(container, packerState)` DoD (subtotal/remaining/progress must show for the packer state alone).
- `css.priority_styles_differ` harness failure overruled by code + visual evidence (pseudo-element rails); only group to keep 375px clean while rendering XSS payload.

## 03_JS_Capstone_Project_Group_8

- Commits: 15 student commits (first 2026-09-08, last 2026-09-11)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_8/report.json` (official — browser skipped), `reassess_report.json` (supplementary), `Artifacts/03_JS_Capstone_Project_Group_8/` (5 screenshots from re-assessment)
- Docker: **as submitted, still broken** — `docker-compose.yml` line 1 is literally `\services:` (stray backslash committed in their initial commit 04e51d48) → `docker compose up` fails validation → Section 6 container points stay 0. For re-assessment only, the backslash was fixed in a throwaway `/tmp` copy (submission untouched) and the app was served on :8008 so the UI could be driven with the same payloads/regexes as the official harness.

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 19/20 | Engine vectors 8/8 verified via direct node import (pure module); packer proven live in node: custom cap 500 ✓, breach blocked (add 500 after 600 → refused, total 600) ✓, remove ✓; `addItem` returns `{success}` objects — consistent with their `main.js` `.success` check; minor deduction: `getItems()` leaks the live internal array while `getTotal()` uses a separate `total` accumulator (desync risk on external mutation) → private+closure row 1/2 |
| 2. Role B DOM/UI | 7/20 | XSS end-to-end PASSES (`__xssTest` unset, 0 imgs/scripts) → sanitize + XSS rows full 5; cards have **no `data-priority` attribute** (inline color styles) → attr + tier rows 0; `#queue-count` missing (cards render, count NaN) → half; delegation works behaviorally (remove 3→2) but uses `event.target.dataset.action` with **no `closest()`** → technique row 0; POS live-confirmed broken: `renderPOSRegister` reads `packerState.items`/`totalPrice` which the packer never exposes → item invisible, no subtotal, budget bar is a `<div>` not `<progress>` → POS rows 0 |
| 3. Role C Async/Storage | 17/20 | Live-proven: 81 provinces sorted ✓, fallback 4 mock provinces with PSGC blocked ✓, key exact ✓, 2 entries after registrations ✓, remove syncs storage (2 remain) ✓; cascade only province→city (no barangay) → half |
| 4. CSS | 7/15 | `:root` vars + 16 `var(--…)` usages + flex/grid ✓; no `[data-priority]` selectors, 0 computed tiers; **375px overflow confirmed live: scrollWidth 501 vs 375** → 0 |
| 5. System | 13/15 | Page loads clean, zero page/console errors ✓; wiring chain proven live (form→engine→storage→render→reset) ✓; module graph resolves through Vite ✓; E2E half (count-sync missing); `form.reset()` works ✓; packer+POS listeners wired ✓ (render defect counted in B) |
| 6. Docker & Quality | 5/10 | container+logs 0 — compose invalid **as submitted** (temp-copy fix was ours, not theirs); commit heuristic FAIL (14 words) → 0; readability 330 lines / 0 >160ch ✓ (1); no excluded tracked ✓ (3) |

### Remarks
- Re-assessment raised the score 50.5 → **68** by replacing conservative zeros with real behavioral evidence: the app actually works well for registration, XSS defense, removal, storage, and PSGC fallback — the compose typo was masking a mostly-functional UI.
- Remaining hard deductions are genuine product defects: invalid compose (never runnable as submitted), POS completely non-functional due to the render/packer API mismatch, no `data-priority`/tier theming, no `closest()` technique, no barangay cascade, no queue count, mobile overflow 501px.
- Section 6 container points (4) and commit-quality point (1) were NOT re-earned — both depend on the submission as committed.

## 03_JS_Capstone_Project_Group_9

- Commits: 2 student commits (first 2026-09-12, last 2026-09-14)
- Evidence: `artifacts/wmad-302-2026-1-03_JS_Capstone_Project_Submissions/03_JS_Capstone_Project_Group_9/report.json` (official — crashed mid-run), `reassess_report.json` (supplementary, tab-aware), `Artifacts/03_JS_Capstone_Project_Group_9/` (5 screenshots from re-assessment)
- Docker: up/build ✅, HTTP 200 ✅, logs clean ✅. Official harness crashed at the second registration because `activateTab('queue')` (main.js:140) hides the form after every submit. Re-assessment drove the same checks with tab-aware interaction (clicking back to the registration/packer tabs like a human user) and a dialog auto-accept for the remove `confirm()` — no code changes.

### Section scores

| Section | Earned | Key evidence |
| --- | --: | --- |
| 1. Role A Engine | 20/20 | v1–v8 all exact (official harness runtime) + node direct import ✓; packer caps/add/remove/private ✓; `getItems` returns spread copy |
| 2. Role B DOM/UI | 17/20 | Sanitize + XSS E2E proven live (`__xssTest` unset, 0 imgs/scripts) → full; data-priority attr, HIGH and CRITICAL both verified live → full; cards render but **no `#queue-count`** → half; `closest('[data-action]')` exact ✓ 2.5; remove **passes live** (cards 3→2, dialog auto-accepted; confirm() blocks unassisted automation) → full; POS works on the packer tab: item visible, `Subtotal: ₱300` matches, `<progress value=300 max=1000>` ✓ → full; no `REMAINING BUDGET:` label → half |
| 3. Role C Async/Storage | 17/20 | All live-proven: 81 provinces sorted ✓, fallback 3 mock provinces ✓, key exact ✓, entries ✓, remove leaves 2/3 in storage ✓; cascade only province→city (no barangay) → half |
| 4. CSS | 12/15 | vars + attr selectors ✓; **3 distinct computed tier styles proven live** (bg #fef2f2/#fffbeb/#eff6ff + distinct border colors) → themes+differ full; **375px overflow confirmed: scrollWidth 459 vs 375** → 0 (was unproven half) |
| 5. System | 13/15 | Zero page/console errors ✓; rich wiring (tabs+aria, toasts, dashboard, offline banner) ✓; module importable ✓; E2E half (register_creates_card fails on missing count despite cards rendering); reset works ✓; packer+POS wired ✓ |
| 6. Docker & Quality | 8/10 | container+200+logs ✅ (4); commit quality FAIL — 2 commits, 14 words → 0; readability 397 lines / 0 >160ch ✅ (1); no excluded tracked ✅ (3) |

### Remarks
- Re-assessment raised the score 79 → **87**: everything previously credited on code-read alone was confirmed live (XSS, tier theming, remove, POS add/subtotal/progress, storage, fallback, reset), and two previously-unproven rows resolved — responsive 375 now a confirmed fail (459px), progress element a confirmed pass.
- Structural deductions unchanged: tabbed UI hides the form after each submit (contract violation; harness crash cause), `window.confirm()` on remove blocks unassisted automation, no barangay select, no `#queue-count`, thin 2-commit history.
- Tab-aware re-assessment does not excuse the tab design — a human must click back to the registration tab after every submission — but it separates "harness-incompatible UX" from "broken features," and Group 9's features are otherwise solid.

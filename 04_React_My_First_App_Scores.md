# React My First App — Scores

- Rubric: StarterKit README — 5 categories = 50 pts (no bonus)
- Due: 2026-09-30 (late penalty prorated daily: 12.5%/7 days, max 62.5%)
- Verified via docker compose (localhost:800N) + headless Playwright harness
  (all external API traffic mocked with fixtures — zero live calls)
- Last evaluated: 2026-11-04T11:25:26+08:00
- Scoring: each rubric row full/half/zero from harness checks + code reading;
  section totals rounded to nearest integer (½ rounds up)

## Summary

| Student Folder | Hooks/10 | Life/10 | Map/12 | Async/10 | Theme/8 | Earned/50 | Days Late | Deduction | Final | Notes |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --- |
| 04_React_My_First_App_Asiab_May-anne | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Buslay_Manuel | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Carretero_Janily_II | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_David_Grace | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Dayaoen_Keziah | 10 | 10 | 12 | 10 | 8 | 50 | 2.88 | 5.15% | 47.43 | late 2.88 d |
| 04_React_My_First_App_Fabro_Jonhel | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Guinid_EdgarJr | 10 | 10 | 12 | 10 | 8 | 50 | 1.4 | 2.5% | 48.75 | late 1.4 d |
| 04_React_My_First_App_Icad_Jamiell | 10 | 7 | 4 | 5 | 8 | 34 | 0 | 0% | 34 | dummyjson API; stubbed getTags |
| 04_React_My_First_App_Kila-an_Karyll | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Lawa_Elsa | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Mendoza_Cheeyene | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Micael_Jessica_Angela | 7 | 10 | 9 | 10 | 8 | 44 | 0 | 0% | 44 | no useRef; chips = global tags |
| 04_React_My_First_App_Panpanico_Glen | 7 | 3 | 0 | 1 | 6 | 17 | 0 | 0% | 17 | mount crash; broken endpoint |
| 04_React_My_First_App_Sibayan_Christine | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |
| 04_React_My_First_App_Sumerbang_Marvin | 10 | 10 | 12 | 10 | 8 | 50 | 0 | 0% | 50 | on time; 39/39 |

Class total: 691.18 / 750. 12 students at 50/50; 3 students with genuine
rubric gaps (Icad, Micael, Panpanico); 2 late penalties applied (Dayaoen,
Guinid).

## Details

### 04_React_My_First_App_Asiab_May-anne

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Asiab_May-anne/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — `quote`/`tags`/`selectedTag` states ✅, `selectTagRef` bound via `inputRef` ✅, App dark-mode `useState(false)` ✅
- 2. Lifecycle: 10/10 — mount effect calls both loaders ✅; fixture quote + 7 tag options on mount ✅; no request loop ✅; 0 student console errors ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2: wisdom, inspiration) ✅, options from tags ✅, picked `wisdom` → `MuiChip-colorSuccess` ✅, refresh ✅
- 4. Async: 10/10 — captured `https://quoteslate.vercel.app/api/quotes/random?tags=wisdom` ✅, `/tags` fetched ✅, injected 500 → fallback ✅, axios + try/catch + mapping ✅
- 5. Theme: 8/8 — ThemeProvider + `palette.mode` ✅, SpeedDial "Dark Mode" flipped page background ✅, 375px no overflow ✅
- Submission commit: 167ba14d (2026-09-26T17:24:19+08:00); first 2026-09-26T10:21:53+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 harness checks passed; no deductions.

### 04_React_My_First_App_Buslay_Manuel

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Buslay_Manuel/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 676cee55 (2026-09-27T06:47:37+08:00); first 2026-09-26T10:23:13+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed. SpeedDial `aria-label`s empty — used `tooltipTitle={action.name}` (prop dropped in MUI v9, suggested by StarterKit TODO); toggle exercised via `actions[0]` ✅, no deduction.

### 04_React_My_First_App_Carretero_Janily_II

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Carretero_Janily_II/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 5b508f14 (2026-09-28T09:09:36+08:00); first 2026-09-28T09:09:36+08:00 (1 commit)
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed. `tooltipTitle` used → empty SpeedDial labels (MUI v9 drift, no deduction); single-commit submission, still on time.

### 04_React_My_First_App_David_Grace

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_David_Grace/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial "Dark Mode" flipped background ✅, 375px ✅
- Submission commit: 2a17ca61 (2026-09-26T20:40:38+08:00); first 2026-09-26T10:21:51+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 harness checks passed; no deductions.

### 04_React_My_First_App_Dayaoen_Keziah

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Dayaoen_Keziah/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 27355478 (2026-10-03T21:12:56+08:00); first 2026-10-03T19:25:00+08:00
- Late penalty: 2.88 days → 5.15% → final 47.43/50 (50 × (1 − 0.0515) = 47.43)
- Remarks: Work itself is perfect (39/39); only the late submission (2.88 d after due) costs points. `tooltipTitle` used → empty SpeedDial labels (no deduction).

### 04_React_My_First_App_Fabro_Jonhel

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Fabro_Jonhel/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: df25fc5b (2026-09-29T04:22:06-07:00 = 2026-09-29T19:22:06+08:00); first 2026-09-25T19:32:14-07:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed. Commits in −07:00 timezone but last commit still lands before the 2026-09-30T23:59:59+08:00 due date → on time. `tooltipTitle` used → empty SpeedDial labels (no deduction).

### 04_React_My_First_App_Guinid_EdgarJr

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Guinid_EdgarJr/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial "Dark Mode" flipped background ✅, 375px ✅
- Submission commit: 58028bdc (2026-10-02T09:38:51+08:00); first 2026-09-26T09:59:44+08:00
- Late penalty: 1.4 days → 2.5% → final 48.75/50 (50 × (1 − 0.025) = 48.75)
- Remarks: Work itself is perfect (39/39); late by 1.4 days → 2.5% deduction only.

### 04_React_My_First_App_Icad_Jamiell

- Harness: 32 passed / 7 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Icad_Jamiell/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `selectTagRef` + `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 7/10 — effect present ✅, calls both loaders ✅ (but tags loader is a hardcoded stub → half), quote on mount ✅ (2.5), no loop ✅, clean console ✅; `life.tags_on_mount` ❌ (0/2 — Select shows only "any" because `getTags` returns a hardcoded `[]`)
- 3. Mapping: 4/12 — text/author ✅ (2) + refresh ✅ (2); `chips_from_quote_tags` ❌ (0/3 — dummyjson payload has no `tags` → 0 chips rendered), `select_options_from_tags` ❌ (0/3 — no options from stubbed `getTags`), `conditional_color` ❌ (0/2 — not exercisable). Chip/MenuItem mapping *code* is correct (`quote.tags?.map`, conditional `success`/`secondary`) — the data never arrives
- 4. Async: 5/10 — quote GET captured (`https://dummyjson.com/quotes/random`) ✅ (2), injected 500 → fallback ✅ (2), axios + try/catch + mapping ✅ (1); `tags_param_interpolated` ❌ (0/3 — `getRandomQuote()` takes no tag parameter; URL never contains `?tags=`), `tags_endpoint_called` ❌ (0/2 — no `/tags` request ever made)
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial "Dark Mode" flipped background ✅, 375px ✅
- Submission commit: d0f663b7 (2026-09-28T20:53:03+08:00); first 2026-09-28T20:44:56+08:00
- Late penalty: 0 days → 0% → final 34/50
- Remarks: Chose dummyjson.com (returns no `tags` payload) and hardcoded `getTags → []`, so the whole filter workflow (options, `?tags=` interpolation, tag-driven chips, highlight) is unimplemented — `static.tags_interpolation_code` ❌ confirms no `?tags=` anywhere in `quoteService.js`. Quote load, error fallback, and theme all work.

### 04_React_My_First_App_Kila-an_Karyll

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Kila-an_Karyll/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 1b17f98a (2026-09-27T21:50:34+08:00); first 2026-09-26T10:21:27+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed. `tooltipTitle` used → empty SpeedDial labels (no deduction).

### 04_React_My_First_App_Lawa_Elsa

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Lawa_Elsa/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 7be94092 (2026-09-28T08:29:41+08:00); first 2026-09-28T01:57:03+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed. `tooltipTitle` used → empty SpeedDial labels (no deduction).

### 04_React_My_First_App_Mendoza_Cheeyene

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Mendoza_Cheeyene/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 7a6f86b4 (2026-09-26T19:25:40+08:00); first 2026-09-26T10:34:18+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed. `tooltipTitle` used → empty SpeedDial labels (no deduction).

### 04_React_My_First_App_Micael_Jessica_Angela

- Harness: 35 passed / 4 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Micael_Jessica_Angela/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 7/10 — three states ✅ (1.5×3) + App dark-mode state ✅ (2) = 6.5 → 7/10 (½ up); `static.use_ref_present` ❌ (0/1.5) + `static.input_ref_binding` ❌ (0/2) — no `useRef` anywhere; the Select uses a controlled `value`/`onChange` instead (functional alternative, but the ref requirement is explicitly graded)
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 9/12 — text/author ✅ (2), options from tags ✅ (3), refresh ✅ (2); `chips_from_quote_tags` half (1.5/3) — maps the global `tags` state (7 chips: wisdom…courage) instead of `quote.tags` (2), screenshot-confirmed; `conditional_color` ❌ (0/2) — chips styled with static `sx={{ bgcolor: 'primary.main' }}`, no conditional at all → 8.5 → 9/12 (½ up)
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial "Dark Mode" flipped background ✅, 375px ✅
- Submission commit: b70970e6 (2026-09-30T17:07:15+08:00); first 2026-09-30T17:07:15+08:00 (1 commit)
- Late penalty: 0 days → 0% → final 44/50
- Remarks: Everything async/lifecycle works; deductions only for (a) no ref binding — used Select `onChange` state instead (`static.use_ref_present`, `static.input_ref_binding` ❌), (b) chips show the tag *filter list* rather than the quote's own tags (`map.chips_from_quote_tags` half), (c) no conditional chip color (`map.conditional_color` ❌). Submitted on the due date itself (17:07, before 23:59:59) → on time.

### 04_React_My_First_App_Panpanico_Glen

- Harness: 22 passed / 17 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Panpanico_Glen/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 7/10 — three states ✅ (1.5×3) + App dark-mode state ✅ (2); `input_ref_binding` ❌ (0/2); `use_ref_present` half (0.75/1.5) — `useRef` declared but never bound to anything (dead) → 7.25 → 7/10
- 2. Lifecycle: 3/10 — effect present ✅ (1.5), no request loop ✅ (1), clean console ✅ (0.75) = 3.25 → 3/10; `effect_calls_loaders` ❌ — effect calls only `loadRandomQuote`, `loadTags` is defined but never invoked; `quote_on_mount` ❌ and `tags_on_mount` ❌ — page renders blank; `load.no_page_errors_final` ❌ — `TypeError: Cannot read properties of undefined (reading 'map')`
- 3. Mapping: 0/12 — every behavioral row failed: no quote/author (blank page), 0 chips, 0 options, no highlight, refresh dead
- 4. Async: 1/10 — only `static.service_axios_try_catch` ✅ (1 — axios/try/catch/mapping code present); `quote_request_captured` ❌, `tags_param_interpolated` ❌, `tags_endpoint_called` ❌, `error_fallback` ❌ (card never rendered). Supporting `static.tags_interpolation_code` ❌ — endpoint is the literal string `'${API_URL}/quotes/random'` (single quotes → no interpolation → relative URL → zero external requests)
- 5. Theme: 6/8 — ThemeProvider + `palette.mode` ✅ (1.5+1.5), SpeedDial map ✅ (1), actions array ✅ (0.5), 375px ✅ (1) = 5.5 → 6/8 (½ up); `theme.toggle_changes_bg` ❌ (0/2.5) — no SpeedDial ever renders (app crashed on mount), and the action handlers are bound with lowercase `onclick` (dead even if it did)
- Submission commit: b4e5d932 (2026-09-26T12:27:39+08:00); first 2026-09-26T10:22:00+08:00
- Late penalty: 0 days → 0% → final 17/50
- Remarks: App is broken end-to-end: `loadRandomQuote` calls `getRandomQuote()` **without `await`** → `setQuote(Promise)` → `quote.tags.map(...)` throws `TypeError` on mount → blank page (screenshot `Artifacts/04_React_My_First_App_Panpanico_Glen/01_initial.png` is empty white). Plus literal `'${API_URL}'` endpoint (no interpolation, no external call), effect omits `loadTags`, empty `getTags` body, and lowercase `onclick` on the Next Quote button and SpeedDial actions. All verified genuine in code read — not harness quirks.

### 04_React_My_First_App_Sibayan_Christine

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Sibayan_Christine/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial "Dark Mode" flipped background ✅, 375px ✅
- Submission commit: 8dbfff23 (2026-09-27T12:11:06+08:00); first 2026-09-26T10:23:02+08:00
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 harness checks passed; no deductions.

### 04_React_My_First_App_Sumerbang_Marvin

- Harness: 39 passed / 0 failed (`artifacts/wmad-302-2026-1-04_React_My_First_App_Submissions/04_React_My_First_App_Sumerbang_Marvin/report.json`)
- Docker: up ✅, HTTP 200 ✅
- 1. Hooks & Refs: 10/10 — three states ✅, `inputRef` bound ✅, App dark-mode state ✅
- 2. Lifecycle: 10/10 — effect calls both loaders ✅; quote + tags on mount ✅; no loop ✅; clean console ✅
- 3. Mapping: 12/12 — text/author ✅, chips = `quote.tags` (2) ✅, options ✅, success highlight ✅, refresh ✅
- 4. Async: 10/10 — `?tags=wisdom` captured ✅, `/tags` fetched ✅, 500 → fallback ✅, try/catch ✅
- 5. Theme: 8/8 — theme wiring ✅, SpeedDial toggle via `actions[0]` flipped background ✅, 375px ✅
- Submission commit: 11ecda09 (2026-09-26T20:39:40+08:00); first 2026-09-26T10:18:19+08:00 (14 commits)
- Late penalty: 0 days → 0% → final 50/50
- Remarks: All 39 passed — most iterative student (14 commits, all same day, on time). `tooltipTitle` used → empty SpeedDial labels (no deduction).

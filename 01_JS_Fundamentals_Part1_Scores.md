# JS Fundamentals Part 1 — Scores

- Rubric: 9 tasks × 5 pts = 45 pts
- Due: 2026-09-04 (late penalty prorated daily: 12.5%/7 days, max 62.5%)
- Last evaluated: 2026-10-15T22:50:22+08:00

## Summary

| Student Folder | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | Earned/45 | Days Late | Deduction | Final | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01_JS_Fundamentals_Part1_Asiab_May-anne | 4 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 41 | 0 | 0% | 41 | on time |
| 01_JS_Fundamentals_Part1_Buslay_Manuel | 2 | 4 | 3 | 4 | 3 | 2 | 4 | 4 | 4 | 30 | 0 | 0% | 30 | on time |
| 01_JS_Fundamentals_Part1_Carretero_Janily_II | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 44 | 18.45 | 32.95% | 29.5 | late 18.45d |
| 01_JS_Fundamentals_Part1_David_Grace | 4 | 3 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 40 | 0 | 0% | 40 | on time |
| 01_JS_Fundamentals_Part1_Dayaoen_Keziah | 3 | 3 | 4 | 5 | 3 | 5 | 5 | 2 | 4 | 34 | 0 | 0% | 34 | on time |
| 01_JS_Fundamentals_Part1_Demis_Julie_Anne_Kate | 4 | 4 | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 40 | 34.39 | 61.41% | 15.44 | late 34.39d |
| 01_JS_Fundamentals_Part1_Ebanio_Jessica | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 44 | 5.09 | 9.08% | 40 | late 5.09d |
| 01_JS_Fundamentals_Part1_Fabro_Jonhel | 4 | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 1 | 38 | 0 | 0% | 38 | on time |
| 01_JS_Fundamentals_Part1_Guinid_EdgarJr | 4 | 4 | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 40 | 0 | 0% | 40 | on time |
| 01_JS_Fundamentals_Part1_Icad_Jamiell | 2 | 4 | 5 | 4 | 3 | 5 | 4 | 4 | 4 | 35 | 0 | 0% | 35 | on time |
| 01_JS_Fundamentals_Part1_Lawa_Elsa | 5 | 4 | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 42 | 0 | 0% | 42 | on time |
| 01_JS_Fundamentals_Part1_Lumang-ay_Ruel | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 43 | 0 | 0% | 43 | on time |
| 01_JS_Fundamentals_Part1_Micael_Jessica | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0% | 8 | on time |
| 01_JS_Fundamentals_Part1_Panpanico_Glen | 2 | 4 | 1 | 4 | 4 | 5 | 0 | 0 | 0 | 20 | 0 | 0% | 20 | on time |
| 01_JS_Fundamentals_Part1_Sibayan_Christine | 4 | 5 | 0 | 0 | 5 | 5 | 5 | 3 | 5 | 32 | 0 | 0% | 32 | on time |
| 01_JS_Fundamentals_Part1_Sumerbang_Marvin | 4 | 3 | 4 | 5 | 4 | 5 | 5 | 5 | 4 | 39 | 0 | 0% | 39 | on time |

Scoring calibration applied uniformly (per prior runs): missing `typeof` numeric check in T2 → 4; truthy flags instead of `=== true` in T1/T8 → 4; `{}` reduce seed missing absent categories in T5 → 4; `attempt = 1..retries` loop (only `retries` total executions instead of initial + `retries`) in T9 → 4; `cache[key] !== undefined` re-executing on a cached `undefined` in T7 → 4. Docked to 2–3 when a primary branch/rule fails for realistic inputs (dead branch, wrong threshold, missing guard, wrong filter predicate).

## Details

### 01_JS_Fundamentals_Part1_Asiab_May-anne
- Harness: all 18 asserts pass (M01 6/6, M02 4/4, M03 2/2, M04 4/4, M05 2/2).
- T1 (evaluateAyudaEligibility): 4 — `??` used; truthy flags instead of `=== true` (can return non-boolean).
- T2 (computeJollibeeBill): 4 — `isNaN`+`<=0` guard, `Number(bill.toFixed(2))`; no `typeof` numeric check (numeric strings billed).
- T3 (GCashAccount): 5 — `return this` in both methods, exact `Error("Insufficient GCash Balance")`, ₱ format.
- T4 (getBarangayName): 5 — `?.` ×3 with `??` fallback.
- T5 (summarizeSariSariSales): 5 — blocklist filter, `reduce`, 3-key seed.
- T6 (extractUniqueBarangays): 5 — flatten + `Set` + `sort`.
- T7 (memoize): 4 — `JSON.stringify` key but `cache[key] !== undefined` re-executes on cached `undefined`.
- T8 (createJeepneyFareCalculator): 5 — closure, `Math.max(0, d-4)`, `=== true`, rounded Number.
- T9 (retryGcashPayment): 4 — works, but `attempt = 1..retries` yields only `retries` total executions (spec: initial + retries).
- Submission commit: 696cc8ac (2026-08-29T17:46:27+08:00)
- Late penalty: 0% → final 41/45
- Remarks: no hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_Buslay_Manuel
- Harness: 3 fails — "Senior should qualify" (T1), "Error message matches" (T3), "Sorted unique barangays extracted" (T6).
- T1: 2 — reads nonexistent field `isSeniorOrPWD` (senior branch dead for all inputs) and no `??` (nullish defaulting absent; null case passes only by coercion luck).
- T2: 4 — `isNaN` guard, `<0` instead of `<=0` (0 still returns 0), no `typeof`; rounding correct.
- T3: 3 — chaining, ₱15 fee, format correct; error thrown as `'Insufficient Gcash Balance'` (casing) fails exact-message assert.
- T4: 4 — `?.` used; `||` fallback wrongly replaces empty-string/0 names.
- T5: 3 — filter is allowlist `=== 'completed'` (drops valid 'pending' etc.) and `{}` seed lacks preset keys.
- T6: 2 — builds/dedupes Set but no `return` and no `sort()`; function returns `undefined`.
- T7: 4 — `cache[key] === undefined` weak cache-hit check.
- T8: 4 — `if (distanceKm > 4)` branch instead of `Math.max`; truthy discount check.
- T9: 4 — `attempt = 1..retries` → `retries` total executions, not retries+1.
- Submission commit: cffef7a8 (2026-08-30T19:04:41+08:00)
- Late penalty: 0% → final 30/45
- Remarks: no hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_Carretero_Janily_II
- Harness: all 18 asserts pass.
- T1: 5 — `??` + strict `=== true` on both flags.
- T2: 4 — `Number.isFinite` guard + `=== true` + `Number(total.toFixed(2))`; no literal `typeof` check.
- T3: 5 — full compliance (`return this` ×2, exact message, named fee const).
- T4: 5 — `?.` + `??`.
- T5: 5 — correct blocklist filter, reduce, 3-key seed.
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `key in cache` (cached `undefined` handled correctly).
- T8: 5 — `Math.max(0, d-4)`, `=== true`, `Number(toFixed(2))`.
- T9: 5 — `attempt = 0..retries` = initial + `retries` executions; final error rethrown.
- Submission commit: ea8fe258 (2026-09-23T10:53:42+08:00)
- Late penalty: 18.45 days → 32.95% → final 29.5/45
- Remarks: highest earned score; late by 18.45 days; no hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_David_Grace
- Harness: 1 fail — "Invalid price returns 0" (T2).
- T1: 4 — `??` present; truthy flags instead of `=== true`.
- T2: 3 — validity guard entirely absent (`'invalid'` → NaN, `-50` → `-56`); discount/VAT math and rounding correct for valid inputs.
- T3: 5 — full compliance.
- T4: 5 — `?.` + `??`.
- T5: 5 — blocklist filter, reduce, 3-key seed with `|| 0` guard.
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `hasOwnProperty` (undefined-safe).
- T8: 4 — `Math.max` correct; truthy discount check instead of `=== true`.
- T9: 4 — `attempt < retries` → `retries` total executions (also `retries=0` throws `undefined`).
- Submission commit: d2e1d400 (2026-08-29T16:50:16+08:00)
- Late penalty: 0% → final 40/45
- Remarks: no hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_Dayaoen_Keziah
- Harness: 2 fails — both T8 asserts (6km regular + 6km senior fare).
- T1: 3 — `??` used twice but threshold `dependentCount > 0` instead of `>= 3` (1 dependent wrongly qualifies — primary rule fails for realistic input); truthy flags.
- T2: 3 — NaN guard present but `<= 0` guard missing (`-50` → `-56`); no `typeof`.
- T3: 4 — chaining, exact message, format correct; unrequested `cashIn` throws on `amount <= 0` (spec says cashIn adds amount and returns `this`).
- T4: 5 — `?.` + `??`.
- T5: 3 — allowlist filter `=== 'completed'` drops valid statuses; `{}` seed lacks preset keys.
- T6: 5 — nested forEach flatten + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `key in cache`.
- T8: 2 — free zone is **2 km** not 4 km (`distanceKm - 2`), no `Math.max`; both 6km asserts fail (fare 20 / 16 vs 16.50 / 13.20).
- T9: 4 — `attempt = 1..retries` → `retries` total executions.
- Submission commit: 1403655c (2026-09-01T16:31:48+08:00)
- Late penalty: 0% → final 34/45
- Remarks: T8 wrong-threshold bug is genuine logic error, not gaming; harness untouched.

### 01_JS_Fundamentals_Part1_Demis_Julie_Anne_Kate
- Harness: all 18 asserts pass.
- T1: 4 — `??` and `>= 3` correct, wrapped in `Boolean()`; truthy flag checks inside instead of `=== true`.
- T2: 4 — `Number.isFinite` guard + rounding correct; no literal `typeof` check (`< 0` instead of `<= 0`, but 0 still returns 0).
- T3: 5 — full compliance (exact `balance < amount + 15` guard).
- T4: 5 — `?.` + `??`.
- T5: 4 — correct blocklist filter + reduce; `{}` seed lacks preset keys.
- T6: 5 — `flatMap` + `Set` + `sort` (with null-guard).
- T7: 5 — `JSON.stringify` + `!(key in cache)`; preserves `this`.
- T8: 4 — `Math.max` + constants correct; truthy ternary instead of `=== true`.
- T9: 4 — `attempt = 1..retries` → `retries` total executions (final error correctly rethrown).
- Submission commit: 13ef8573 (2026-10-09T09:17:30+08:00)
- Late penalty: 34.39 days → 61.41% → final 15.44/45
- Remarks: genuinely late (student-authored commits on 2026-10-09); strong code otherwise.

### 01_JS_Fundamentals_Part1_Ebanio_Jessica
- Harness: no `index.js`/`package.json` in submission (starter runner files missing) — ran all five `run*Tests()` in isolation; all 18 asserts pass.
- T1: 5 — `??` + strict `=== true` on both flags.
- T2: 4 — `Number.isFinite` guard + `=== true` + rounding; no literal `typeof` check.
- T3: 5 — full compliance.
- T4: 5 — `?.` + `??`.
- T5: 5 — blocklist filter, reduce, 3-key seed.
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `key in cache`.
- T8: 5 — `Math.max(0, d-4)`, `=== true`, `Number(toFixed(2))`.
- T9: 5 — `attempt = 0..retries` = initial + `retries` executions (verified: 4 executions for retries=3).
- Submission commit: 56f7530f (2026-09-10T02:04:36+08:00, "Rename Activity 01 folder" — contains her solutions)
- Late penalty: 5.09 days → 9.08% → final 40/45
- Remarks: folder-tip commit 2bbec05c (2026-10-10) is an instructor directory move (R100 rename), ignored for lateness; genuine student content commit is 2026-09-10 (5.09 days late). No index.js/package.json (module isolation used). No hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_Fabro_Jonhel
- Harness: M01–M04 all pass; M05 crashes — `ReferenceError: lastError is not defined` (suite exits 1).
- T1: 4 — strict `=== true` and correct threshold, but `??` NOT used (hand-rolled `null/undefined` check — behaviorally equivalent, required technique absent).
- T2: 5 — `typeof` + `isNaN` + `<= 0` guards, `=== true`, `Number(toFixed(2))`.
- T3: 5 — full compliance.
- T4: 5 — `?.` with explicit `undefined`/`null` fallback check (exactly matches "missing or null").
- T5: 4 — correct blocklist filter + reduce; `{}` seed lacks preset keys.
- T6: 5 — forEach flatten + `Set` + `sort`.
- T7: 4 — `JSON.stringify` but `cache[key] !== undefined` re-executes on cached `undefined`.
- T8: 5 — `Math.max`, `=== true`, rounding — full compliance.
- T9: 1 — `lastError` never declared (ReferenceError on first rejection, strict mode) and `sleep(delayMs)` is an undefined function; retry path can never work; happy path only.
- Submission commit: 430d745d (2026-08-29T01:58:37-07:00)
- Late penalty: 0% → final 38/45
- Remarks: T9 crash is a genuine scope/reference bug (structure attempted), not tampering; harness untouched.

### 01_JS_Fundamentals_Part1_Guinid_EdgarJr
- Harness: all 18 asserts pass.
- T1: 4 — `??` present; truthy flags instead of `=== true` (may return non-boolean).
- T2: 4 — `isNaN`+`<=0` guard + rounding; no `typeof` check; truthy discount flag.
- T3: 5 — full compliance.
- T4: 5 — `?.` + `??`.
- T5: 4 — correct blocklist filter + reduce; `{}` seed lacks preset keys.
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `key in cache`.
- T8: 4 — equivalent `if (distanceKm <= 4)` branch instead of `Math.max`; truthy discount; `Math.round(x*100)/100` rounding.
- T9: 4 — `attempt = 1..retries` → `retries` total executions.
- Submission commit: 6447fbbb (2026-08-29T18:09:46+08:00)
- Late penalty: 0% → final 40/45
- Remarks: no hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_Icad_Jamiell
- Harness: 1 fail — "Senior should qualify" (T1).
- T1: 2 — reads nonexistent `isSeniorOrPWD` field (senior branch dead) and no `??`; low-income clause passes only via `null >= 3` coercion.
- T2: 4 — `isNaN` guard, `<0` instead of `<=0`, no `typeof`; rounding correct.
- T3: 5 — full compliance.
- T4: 4 — `?.` used; `||` fallback over-falls-back on falsy names.
- T5: 3 — allowlist filter `=== 'completed'` drops valid statuses; `{}` seed lacks preset keys.
- T6: 5 — forEach flatten + `Set` + `sort`.
- T7: 4 — `cache[key] === undefined` weak cache-hit check.
- T8: 4 — equivalent `if (distanceKm > 4)` branch instead of `Math.max`; truthy discount; `parseFloat(toFixed)`.
- T9: 4 — `attempt = 1..retries` → `retries` total executions.
- Submission commit: a0295dc2 (2026-08-29T17:25:41+08:00)
- Late penalty: 0% → final 35/45
- Remarks: T1 bug mirrors Buslay's (same wrong field name); harness untouched.

### 01_JS_Fundamentals_Part1_Lawa_Elsa
- Harness: all 18 asserts pass.
- T1: 5 — `??` + strict `=== true`.
- T2: 4 — `Number(rawPrice)` + `Number.isNaN` + `<=0` + `=== true`; no literal `typeof` check.
- T3: 5 — full compliance.
- T4: 5 — `?.` + `??`.
- T5: 4 — correct blocklist filter + reduce; `{}` seed lacks preset keys.
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `key in cache`.
- T8: 5 — `Math.max(0, d-4)`, `=== true`, `Number(toFixed(2))` — literal spec.
- T9: 4 — `attempt = 1..retries` → `retries` total executions.
- Submission commit: d17030a9 (2026-08-31T13:53:08+08:00, "Complete Episode 1 JS Fundamentals" — contains her solutions)
- Late penalty: 0% → final 42/45
- Remarks: folder-tip commit 196f35f1 (2026-10-10) is an instructor directory move (R100 rename), ignored for lateness; genuine student content commit is 2026-08-31 (on time). Harness untouched.

### 01_JS_Fundamentals_Part1_Lumang-ay_Ruel
- Harness: all 18 asserts pass.
- T1: 4 — `??` present; truthy flags instead of `=== true`.
- T2: 5 — `typeof` + `isNaN` + `<=0` guard and rounding; truthy discount flag (not listed as T2 dock pattern; behavior correct for boolean inputs).
- T3: 5 — full compliance.
- T4: 5 — `?.` + `??`.
- T5: 5 — blocklist filter, reduce, 3-key seed `{snacks, drinks, canned}`.
- T6: 5 — `flatMap` + `Set` + `Array.from().sort()`.
- T7: 5 — `JSON.stringify` + `key in cache`.
- T8: 4 — `Math.max` + rounding correct; truthy discount instead of `=== true`.
- T9: 5 — `attempt = 0..retries` = initial + `retries` executions; final error rethrown.
- Submission commit: 36d27b08 (2026-08-29T17:30:08+08:00)
- Late penalty: 0% → final 43/45
- Remarks: no hardcoding; harness untouched.

### 01_JS_Fundamentals_Part1_Micael_Jessica
- Harness: M01 passes; M02+ crash — `wallet.cashIn is not a function` (suite exits 1). Isolated module runs: M02/M03/M04 crash (stubs), M05 both asserts fail. Nested folder layout (`<folder>/<same-name>/topics/`), resolved.
- T1: 4 — `??` present; truthy flags instead of `=== true`.
- T2: 4 — `isNaN`+`<=0` guard + rounding; no `typeof` check; truthy discount flag.
- T3: 0 — empty TODO stub (no methods at all; harness crashes).
- T4: 0 — empty TODO stub (returns `undefined` for both cases; no `?.`).
- T5: 0 — empty TODO stub (returns `undefined`).
- T6: 0 — empty TODO stub (returns `undefined`).
- T7: 0 — empty TODO stub (returns `undefined`, not a function).
- T8: 0 — empty TODO stub (returns `undefined`, not a function).
- T9: 0 — empty TODO stub (async fn resolves `undefined`; `paymentFn` never called).
- Submission commit: 58aeb546 (2026-08-29T17:09:55+08:00)
- Late penalty: 0% → final 8/45
- Remarks: only Module 01 completed — matches final commit "Completed Module 01 - Task 2"; work stopped after T2. Not tampering, just unfinished.

### 01_JS_Fundamentals_Part1_Panpanico_Glen
- Harness: M01 2 fails ("Low income w/ 3 dependents qualifies", "Null dependents should default to 0"); M02 crashes (`wallet.cashIn(...).sendMoney is not a function`); isolated: M03 pass, M04 crash (`calc is not a function`), M05 both fail.
- T1: 2 — `??` used and senior path returns `true`, but the low-income/dependent branch is **missing** (no `return`; falls off end → `undefined` for every non-senior citizen); `isLowIncome`/`dependentCount` are dead variables.
- T2: 4 — `Number()` + `isNaN` guard, rounding correct; `<0` instead of `<=0`, no `typeof`, truthy discount flag.
- T3: 1 — partial: `cashIn` implemented correctly (`return this`); `sendMoney` and `getBalance` never defined (TODO) → chain crash.
- T4: 4 — `?.` used and passes harness; guard checks only `=== undefined`, so `name: null` returns `null` instead of the fallback.
- T5: 4 — correct blocklist filter + reduce; `{}` seed lacks preset keys.
- T6: 5 — forEach flatten + `Set` + `sort`.
- T7: 0 — empty TODO stub (returns `undefined`, not a function).
- T8: 0 — empty TODO stub (returns `undefined`, not a function).
- T9: 0 — empty TODO stub (resolves `undefined`; `paymentFn` never called).
- Submission commit: 619b72b5 (2026-08-29T04:20:43-07:00)
- Late penalty: 0% → final 20/45
- Remarks: modules 04 (T7/T8) and 05 (T9) unattempted; T1/T3 incomplete; harness untouched.

### 01_JS_Fundamentals_Part1_Sibayan_Christine
- Harness: `index.js` aborts immediately — `SyntaxError: Unexpected token 'export'` in `topics/02_objects_and_this.js:12` (unclosed `GCashAccount` brace from line 3). Isolated runs: M01/M03/M05 all pass; M04 1 fail ("6km trip senior fare").
- T1: 4 — `??` present; truthy flags instead of `=== true`.
- T2: 5 — `typeof` + `Number.isNaN` + `<=0` guards, `=== true`, `Number(toFixed(2))` — full compliance.
- T3: 0 — file fails to parse (SyntaxError on load); also `sendMoney`/`getBalance` are never defined (only partial `cashIn` present).
- T4: 0 — same broken file cannot load; (code has `?.` but `||` fallback; unreachable).
- T5: 5 — single `reduce` with inline voided/refunded exclusion + 3-key seed (filter semantics satisfied inside reducer).
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `!(key in cache)` (cached `undefined` handled).
- T8: 3 — closure + `Math.max(0, d-4)` + discount correct, but **no rounding** (`16.5 * 0.8` → `13.200000000000001` fails senior assert); truthy flag; 2/3 asserts pass.
- T9: 5 — `attempt = 0..retries` = initial + `retries` executions; final error rethrown.
- Submission commit: c4e732e5 (2026-08-30T01:18:49+08:00)
- Late penalty: 0% → final 32/45
- Remarks: syntax error (unclosed brace) is a genuine coding mistake, not tampering; costs both T3 and T4 (module unloadable). Harness untouched.

### 01_JS_Fundamentals_Part1_Sumerbang_Marvin
- Harness: all 18 asserts pass.
- T1: 4 — `??` present; truthy flags instead of `=== true`.
- T2: 3 — `typeof` + `isNaN` guard present but `<= 0` condition missing: `computeJollibeeBill(-50, …)` → `-56` (spec requires 0); rounding correct.
- T3: 4 — full compliance plus unrequested validation (`cashIn`/`sendMoney` throw `'Invalid … amount'` for `amount <= 0`, deviating from spec behavior for 0 amounts).
- T4: 5 — `?.` + `??`.
- T5: 4 — correct blocklist filter + reduce; `{}` seed lacks preset keys.
- T6: 5 — `flatMap` + `Set` + `sort`.
- T7: 5 — `JSON.stringify` + `key in cache`.
- T8: 5 — `Math.max(0, d-4)`, strict `=== true` (verified `fc(6,1)` not discounted), `Number(toFixed(2))`.
- T9: 4 — `attempt = 1..retries` → `retries` total executions (probe: fails early when success needs execution 4 of 4); passes harness because its `failingFn` succeeds on execution 3.
- Submission commit: aa8737f2 (2026-08-30T21:21:50+08:00)
- Late penalty: 0% → final 39/45
- Remarks: no hardcoding; harness untouched.

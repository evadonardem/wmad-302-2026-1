# JS Fundamentals Part 2 — Scores

- Rubric: 3 modules × 10 pts = 30 pts
- Due: 2026-09-04 23:59:59 PHT (late penalty prorated daily: 12.5%/7 days, max 62.5%)
- Last evaluated: 2026-10-15T01:28:46+08:00

## Summary

| Student Folder | M1 | M2 | M3 | Earned/30 | Days Late | Deduction | Final | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02_JS_Fundamentals_Part2_Asiab_May-anne | 10 | 10 | 10 | 30 | 0 | 0% | 30 | on time |
| 02_JS_Fundamentals_Part2_Buslay_Manuel | 10 | 7 | 10 | 27 | 0 | 0% | 27 | on time; M2 handler throws (undeclared `action`) |
| 02_JS_Fundamentals_Part2_Carretero_Janily_II | 10 | 10 | 10 | 30 | 18.4986 | 33.03% | 20.09 | late |
| 02_JS_Fundamentals_Part2_David_Grace | 9 | 10 | 10 | 29 | 0 | 0% | 29 | on time; M1 else-branch over-counts delayed |
| 02_JS_Fundamentals_Part2_Demis_Julie_Anne_Kate | 10 | 10 | 10 | 30 | 34.4023 | 61.43% | 11.57 | late |
| 02_JS_Fundamentals_Part2_Ebanio_Jessica | 10 | 10 | 10 | 30 | 6.3013 | 11.25% | 26.63 | late (date via --follow fallback) |
| 02_JS_Fundamentals_Part2_Fabro_Jonhel | 10 | 10 | 10 | 30 | 8.9257 | 15.94% | 25.22 | late |
| 02_JS_Fundamentals_Part2_Guinid_EdgarJr | 9 | 10 | 10 | 29 | 0 | 0% | 29 | on time; M1 else-branch over-counts delayed |
| 02_JS_Fundamentals_Part2_Icad_Jamiell | 8 | 10 | 10 | 28 | 0 | 0% | 28 | on time; M1 label + else-branch deviations |
| 02_JS_Fundamentals_Part2_Lawa_Elsa | 10 | 10 | 10 | 30 | 0 | 0% | 30 | on time (date via --follow fallback) |
| 02_JS_Fundamentals_Part2_Lumang-ay_Ruel | 10 | 10 | 10 | 30 | 0 | 0% | 30 | on time |
| 02_JS_Fundamentals_Part2_Mendoza_Cheeyene | 7 | 10 | 8 | 25 | 34.4842 | 61.58% | 9.61 | late; M1 bare labels, M3 wrong card markup |
| 02_JS_Fundamentals_Part2_Micael_Jessica_Angela | 10 | 10 | 10 | 30 | 30.4088 | 54.3% | 13.71 | late |
| 02_JS_Fundamentals_Part2_Panpanico_Glen | 7 | 6 | 6 | 19 | 0 | 0% | 19 | on time; M1 bare labels, M2 wrong dataset key, M3 no trim |
| 02_JS_Fundamentals_Part2_Sibayan_Christine | 8 | 10 | 10 | 28 | 0 | 0% | 28 | on time; M1 label + else-branch deviations |
| 02_JS_Fundamentals_Part2_Sumerbang_Marvin | 10 | 10 | 10 | 30 | 0 | 0% | 30 | on time |

## Details

### 02_JS_Fundamentals_Part2_Asiab_May-anne
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full; click-time counts via `dataset`, exact labels
- M2: 10 — single delegated listener, `closest()` early exit, `Number(dataset.amount)`, ₱XX.XX correct
- M3: 10 — `preventDefault()`, trim ≥5, both errors shown, exact `.resident-card`/`h3` structure, reset on success
- Submission commit: 98974613 (2026-08-29T19:29:29+08:00, author May-anne Asiab <mayasiab6@gmail.com>)
- Late penalty: 0% → final 30/30
- Remarks: base files unmodified; no anomalies

### 02_JS_Fundamentals_Part2_Buslay_Manuel
- Harness: m1 3/3, m2 3/6, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full; counts `delayed`/`full`, exact labels
- M2: 7 — single listener (C1 full), `closest()` early exit (C2 full); `action` is never declared → ReferenceError on every button click (`m2.runtime_exception`), so add/clear/display are unreachable: C3 half (correct `Number(dataset.amount)` logic present but dead), C4 half (vacuous ₱0.00 clear), C5 half (display never updates)
- M3: 10 — all checkpoints full
- Submission commit: 5e50876d (2026-08-30T21:15:48+08:00, author Manuel Buslay <2025-1-0411.buslay@kcp.edu.ph>)
- Late penalty: 0% → final 27/30
- Remarks: base files unmodified; M2 broken by undeclared variable (`const action` missing)

### 02_JS_Fundamentals_Part2_Carretero_Janily_II
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: afe2e005 (2026-09-23T11:58:00+08:00, author Janily II Carretero <2025-1-0085.carretero@kcp.edu.ph>)
- Late penalty: 18.4986 days × 12.5%/7 = 33.03% → final 20.09/30
- Remarks: base files unmodified; code is fully compliant, only lateness penalized

### 02_JS_Fundamentals_Part2_David_Grace
- Harness: m1 1/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 9 — labels exact (C3 full); `else { delayedCount++ }` counts any non-`active` li (incl. `idle`) as delayed → dynamic/repeat fail → C2 half; C1/C4 full (`getAttribute` read, `innerText` write is permitted)
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: 290593e7 (2026-08-29T18:10:03+08:00, author Grace David <gracemdavid7@gmail.com>)
- Late penalty: 0% → final 29/30
- Remarks: base files unmodified

### 02_JS_Fundamentals_Part2_Demis_Julie_Anne_Kate
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full; card built via DOM APIs (`append`/`textContent`) with exact structure
- Submission commit: badb6daa (2026-10-09T09:39:15+08:00, author Julie Anne Kate Demis <demisjulieanne@gmail.com>)
- Late penalty: 34.4023 days × 12.5%/7 = 61.43% → final 11.57/30
- Remarks: base files unmodified; code fully compliant, only lateness penalized

### 02_JS_Fundamentals_Part2_Ebanio_Jessica
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: 862c70b3 (2026-09-11T07:13:53+08:00, author Jessica Ebanio <2025-1-0380.ebanio@gmail.com>) — folder-path log contained only maintainer commits (folder moved), so date taken via `--follow` on `src/01_…`/`src/02_…`, author confirmed as this student
- Late penalty: 6.3013 days × 12.5%/7 = 11.25% → final 26.63/30
- Remarks: base files unmodified; `--follow` on `src/03_forms_and_lifecycle.js` chains into another student's history (rename artifact) — not used for dating

### 02_JS_Fundamentals_Part2_Fabro_Jonhel
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: ed7f4240 (2026-09-13T07:13:00-07:00 = 2026-09-13T22:13:00+08:00, author 2024-1-0097fabro-ux <2024-1-0097.fabro@kcp.edu.kcp>)
- Late penalty: 8.9257 days × 12.5%/7 = 15.94% → final 25.22/30
- Remarks: base files unmodified; author committed from a non-PHT timezone (converted to PHT for lateness)

### 02_JS_Fundamentals_Part2_Guinid_EdgarJr
- Harness: m1 1/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 9 — labels exact (C3 full); `else { delayedCount++ }` counts non-`active` li as delayed → C2 half; C1/C4 full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: bb3279bc (2026-08-29T22:35:31+08:00, author Edgar Guinid <edgarguinid@gmail.com>)
- Late penalty: 0% → final 29/30
- Remarks: base files unmodified

### 02_JS_Fundamentals_Part2_Icad_Jamiell
- Harness: m1 0/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 8 — counting uses `else` → any non-`active` li counted as delayed (dynamic/repeat fail) → C2 half (1); `#stat-delayed` label reads `"Delayed Routes: X"` instead of `"Delayed/Full: X"` (active label correct) → C3 half (1.5); C1/C4 full → 7.5, rounds up to 8
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: 760d91e4 (2026-08-29T18:11:36+08:00, author Jamiell <icajamiell74@gmail.com>)
- Late penalty: 0% → final 28/30
- Remarks: base files unmodified

### 02_JS_Fundamentals_Part2_Lawa_Elsa
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — C1/C2/C3/C5 full; C4 half (card `<h3>` reads `"Barangay Resident Card"`, omitting the 🏛️ emoji prefix of the spec) → 9.5, rounds up to 10
- Submission commit: 59f7fdb9 (2026-08-31T15:03:23+08:00, author Elsa Lawa <ashlynlawa@email.com>) — folder-path log contained only maintainer commits (folder moved), so date taken via `--follow` on module files, author confirmed as this student
- Late penalty: 0% → final 30/30
- Remarks: base files unmodified; heading emoji omitted (otherwise exact structure)

### 02_JS_Fundamentals_Part2_Lumang-ay_Ruel
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full; resets by clearing both inputs individually (form has exactly 2 fields → equivalent to `form.reset()`)
- Submission commit: 0eb07f6e (2026-08-29T19:34:23+08:00, author Ruel Lumang-ay <2024-1-0737.lumang-ay@kcp.edu.ph>)
- Late penalty: 0% → final 30/30
- Remarks: base files unmodified

### 02_JS_Fundamentals_Part2_Mendoza_Cheeyene
- Harness: m1 2/3, m2 5/5, m3 8/9 checks pass (harness v1.1.0)
- M1: 7 — counting correct by `data-status` (C2 full), technique OK (C4 full), but writes bare numbers (`textContent = activeCount`) instead of `"Active Routes: X"` / `"Delayed/Full: Y"` → C3 = 0 (both labels wrong)
- M2: 10 — all checkpoints full (`parseFloat` is not a deviation)
- M3: 8 — C1/C2/C3/C5 full; card uses `<div class="id-card">`/`<h4>`/`<p>Purok: …` with no `<strong>` and no 🏛️ heading → C4 = 0
- Submission commit: 7e822ef7 (2026-10-09T11:37:12+08:00, author Cheeyene Mendoza <mendozacheeyene06@gmail.com>)
- Late penalty: 34.4842 days × 12.5%/7 = 61.58% → final 9.61/30
- Remarks: base files unmodified

### 02_JS_Fundamentals_Part2_Micael_Jessica_Angela
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: c1240243 (2026-10-05T09:48:39+08:00, author Jessica Micael <your-github-jhezzicka00@gmail.com>)
- Late penalty: 30.4088 days × 12.5%/7 = 54.30% → final 13.71/30
- Remarks: base files unmodified; code fully compliant, only lateness penalized

### 02_JS_Fundamentals_Part2_Panpanico_Glen
- Harness: m1 2/3, m2 3/5, m3 6/9 checks pass (harness v1.1.0)
- M1: 7 — counting correct via `getAttribute` (C2 full, C4 full), but writes bare numbers → C3 = 0
- M2: 6 — single listener (C1 full), `closest()` early exit (C2 full); reads `Number(btn.dataset.price)` instead of `dataset.amount` → ₱NaN → C3 = 0, C5 half; clear branch reachable and works → C4 full
- M3: 6 — `preventDefault()` (C1 full), reset + no card on invalid (C5 full); name checked on raw `value` with no `trim()` → `"  Ana  "` passes (min-length boundary otherwise correct) → C2 half; early `return` after first error means purok error never shows when name is also invalid → C3 half; card uses `id-card`/`h3 "Resident ID"`/`<p>Name: …` without `<strong>` and "Purok:" instead of "Zone:" → C4 = 0
- Submission commit: d4be37a1 (2026-08-29T03:00:32-07:00 = 2026-08-29T18:00:32+08:00, author Asta1233 <glen.panpanico123@gmail.com>) — later commits on the folder are maintainer-only
- Late penalty: 0% → final 19/30
- Remarks: base files unmodified; multiple spec deviations across all three modules

### 02_JS_Fundamentals_Part2_Sibayan_Christine
- Harness: m1 0/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 8 — `else { delayedCount++ }` over-counts delayed (dynamic/repeat fail) → C2 half (1); `#stat-delayed` label reads `"Delayed Routes: X"` → C3 half (1.5); C1/C4 full → 7.5, rounds up to 8
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: 92e80997 (2026-08-30T09:16:22+08:00, author Christine Sibayan <2025-1-0389.sibayan@gmail.com>)
- Late penalty: 0% → final 28/30
- Remarks: base files unmodified

### 02_JS_Fundamentals_Part2_Sumerbang_Marvin
- Harness: m1 3/3, m2 5/5, m3 9/9 checks pass (harness v1.1.0)
- M1: 10 — all checkpoints full
- M2: 10 — all checkpoints full
- M3: 10 — all checkpoints full
- Submission commit: c6cabdbc (2026-08-31T18:26:12+08:00, author Mavs <msumerbang@gmail.com>)
- Late penalty: 0% → final 30/30
- Remarks: base files unmodified; no anomalies

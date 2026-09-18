# Module Checklists, Deliverables & Detailed Grading Rubric

---

## ⚙️ Role A: Engine Lead (`src/modules/engine.js`)
- [ ] Implement `evaluateAyudaEligibility(citizen)`:
  - Add **+35 pts** for Senior Citizen (`isSenior === true`).
  - Add **+35 pts** for PWD (`isPWD === true`).
  - Add **+20 pts** for Low Income (`monthlyIncome < 10000`).
  - Add **+5 pts** per dependent (capped at **20 pts** max). Use nullish coalescing (`??`) to default `dependentCount` to `0`.
  - Classify priority tier: `CRITICAL` (score >= 70), `HIGH` (score 40–69), `LOW` (score < 40).
  - **Definition of Done:** Must return an object matching `{ priority, score, approved }`.
- [ ] Implement `createReliefPacker(budgetCap = 1000)` using private state closures:
  - Expose methods: `addItem(name, price)`, `removeItem(index)`, `getTotal()`, `getItems()`, and `getBudgetCap()`.

---

## 🎨 Role B: DOM & UI Lead (`src/modules/dom.js` & `src/style.css`)
- [ ] Implement `sanitizeHTML(str)` to prevent XSS injection on user inputs.
- [ ] Implement `renderResidentCards(container, residents)` to dynamically display queue cards with exact `data-priority="${resident.priority}"` attributes.
- [ ] Implement `renderPOSRegister(container, packerState)` displaying item subtotal, remaining budget, and an HTML `<progress>` bar.
- [ ] Implement `setupActionDelegation(rootElement, actionMap)` using `e.target.closest('[data-action]')`.

---

## 🌐 Role C: Async & Storage Lead (`src/modules/async.js`)
- [ ] Implement `fetchProvinces()` calling the PSGC API with fallback to mock data on network error.
- [ ] Implement `fetchCitiesMunicipalities(provinceCode)` with cascading lookup and error handling.
- [ ] Implement `getOfflineQueue()`, `saveToOfflineQueue(data)`, and `removeFromOfflineQueue(id)` using `localStorage`.
  - **Definition of Done:** LocalStorage must use the exact key `'ebarangay_offline_applications'`.

---

## 🔌 Integration Lead (`src/main.js`)
- [ ] Wire named ES module imports across all files.
- [ ] Bind form submission listeners, execute scoring logic, update offline storage, and re-render the DOM.
- [ ] Initialize global relief packer and wire POS register actions.

---

## 🎨 CSS Styling & Theme Rules (`src/style.css`)
- [ ] Define CSS Custom Properties (`:root`) for color palette, spacing, and typography.
- [ ] Use CSS attribute selectors for dynamic priority styling (`[data-priority="CRITICAL"]`, `[data-priority="HIGH"]`, `[data-priority="LOW"]`).
- [ ] Style form controls, cards, and progress bars with responsive layout constraints using Flexbox or Grid.

---

## 📊 Detailed Grading Rubric (100 Points Total)

### 1. Role A: Core Engine Logic (20 pts)
* **Eligibility Algorithm (10 pts):** Accurate point accumulation for senior status (+35), PWD (+35), low income (+20), and dependents (+5 per dependent, capped at 20 using `??`).
* **Priority Classification (5 pts):** Correct threshold routing (`CRITICAL` >= 70, `HIGH` 40–69, `LOW` < 40) and correct `{ priority, score, approved }` return object.
* **Relief Packer Closure (5 pts):** Private state encapsulation with functioning `addItem`, `removeItem`, `getTotal`, `getItems`, and budget cap enforcement.

### 2. Role B: DOM & UI Execution (20 pts)
* **XSS Sanitization (5 pts):** Effective stripping or escaping of dangerous markup in `sanitizeHTML()`.
* **Dynamic Rendering (5 pts):** Clean template literal generation in `renderResidentCards()` with precise `data-priority` attributes.
* **Event Delegation (5 pts):** Proper utilization of `e.target.closest('[data-action]')` for scalable click handling.
* **POS Register (5 pts):** Clear subtotal calculations and functioning `<progress>` tracking.

### 3. Role C: Async & Storage (20 pts)
* **API Integration (8 pts):** Successful asynchronous fetching from PSGC endpoints with alphabetical sorting.
* **Fallback Handling (4 pts):** Graceful network error catching using mock data.
* **Local Storage Persistence (8 pts):** Reliable read/write/delete operations using the exact key `'ebarangay_offline_applications'`.

### 4. UI/UX & CSS Styling (15 pts)
* **Theme Engine (5 pts):** Professional use of CSS custom properties (`:root`) for colors, fonts, and spacing.
* **Priority Themes (5 pts):** Visual distinction across priority tiers using attribute selectors (`[data-priority="CRITICAL"]`, etc.).
* **Responsiveness (5 pts):** Clean layout alignment using Flexbox/Grid for forms and cards.

### 5. System Integration (15 pts)
* **Module Wiring (7 pts):** Clean ES module imports/exports connecting all files seamlessly through `src/main.js`.
* **Data Flow & Reset (8 pts):** Smooth end-to-end execution from form submission to storage sync and UI re-rendering, including proper form resets.

### 6. Docker & Code Quality (10 pts)
* **Container Stability (4 pts):** The project builds and runs cleanly without errors via `docker compose up`.
* **Code Hygiene (3 pts):** Readable, properly formatted code with logical commit history.
* **No Excluded Files (3 pts):** Absence of `node_modules/` or `dist/` folders in the repository.
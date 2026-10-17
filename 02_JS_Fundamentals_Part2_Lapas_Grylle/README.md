# EPISODE 2: Browser DOM & Event Engine

## Overview
This lab covers browser DOM tree manipulation, event bubbling, single-listener action delegation, form validation, and dynamic element rendering using `Vite`.

## Task Specifications

### Module 01: DOM Traversal & Status Monitor (`src/01_dom_tree_and_selection.js`)
- Bind click event listener to #btn-sync-routes.
- Query all <li> elements inside #route-list.
- Count items with data-status="active" versus data-status="delayed".
- Update text content in #stats-panel:
    - `#stat-active`: `"Active Routes: X"`
    - `#stat-delayed`: `"Delayed/Full: Y"`

### Module 02: Event Delegation POS Register (`src/02_events_and_delegation.js`)

- Attach a single click listener to `#pos-register`.
- Use `event.target.closest('button')` to intercept clicks. If `!button`, exit early.
- Read `dataset.action`:
    - If `action === "add"`: Add `Number(button.dataset.amount)` to running bill total.
    - If `action === "clear"`: Reset running total to `0`.
- Update `#bill-total` element with formatted string: `₱XX.XX`.

### Module 03: Form Validation & ID Card Generator (`src/03_forms_and_lifecycle.js`)

- Intercept `submit` event on `#resident-form` and prevent page reload with `e.preventDefault()`.
- Validation Rules:
    - `#res-name`: Must be >= 5 characters (trimmed). Display error in `#err-name` if invalid.
    - `#res-purok`: Must have a value selected. Display error in `#err-purok` if invalid.
- If valid, clear error messages and append a new resident card to `#id-cards-grid`:

    ```HTML
    <div class="resident-card">
        <h3>🏛️ Barangay Resident Card</h3>
        <p><strong>Name:</strong> [FullName]</p>
        <p><strong>Zone:</strong> [Purok]</p>
    </div>
    ```
- Reset form inputs upon successful submission.
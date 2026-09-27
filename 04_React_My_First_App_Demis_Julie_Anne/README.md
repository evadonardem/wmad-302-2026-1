# My First App: Dynamic Quote Generator (React + Material-UI)

## Objective
Build a dynamic, theme-responsive quote generator connected to an external REST API. You will use **React state management hooks**, lifecycle events, mutable element references, and modular service utilities to handle async networking alongside a production-ready **Material-UI (MUI)** layout.

---

## Technical Specifications & Checklist
To achieve full credit, your application must successfully execute the following workflows:
* **Initial Lifecycle Load:** Fetch a random starting quote and populate the category filter selections concurrently on component mount.
* **Controlled Ref Selections:** Bind elements using mutable references to reliably extract targeted filter criteria without unnecessary component re-renders.
* **Conditional UI Mapping:** Program lists to map datasets dynamically onto Material-UI containers while applying state-based structural colors.
* **Asynchronous Integration:** Interface with backend network endpoints safely using async/await syntax patterns and fallback exception shields.
* **Dynamic Theme Control:** Implement system-wide dark/light mode switches mapped seamlessly across an MUI custom theme provider wrapper.

---

## Grading Rubric & Scoring Mechanics

| Category | Points | Evaluation Requirements |
| :--- | :--- | :--- |
| **1. Hook Configuration & Ref Control** | **10 pts** | Accurate initialization of states for current items, selection properties, arrays, and structural reference tracking nodes. |
| **2. Lifecycle Side Effects** | **10 pts** | Proper utilization of dependency tracking hooks executing data population functions once when component mounts. |
| **3. Interface Component Data Mapping** | **12 pts** | Valid implementation of array mapping structures transforming objects cleanly into Chips, text labels, and Select menu items. |
| **4. Asynchronous Service Operations** | **10 pts** | Correct runtime string interpolation, execution of asynchronous GET operations via Axios, and resilient catch fallback block triggers. |
| **5. Core Layout & Theme Toggling Logic** | **08 pts** | Integration of a theme state listener configuring light/dark style contexts dynamically across child modules. |
| **Total Marks** | **50 pts** | **A fully operational application meeting all architectural and behavioral evaluation metrics.** |

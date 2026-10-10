# EPISODE 1: Core JavaScript & Algorithmic Logic

## Overview

This lab focuses on core JavaScript runtime mechanics: variable scoping, type coercion, context binding (`this`), array pipelines, closures, and async promise chains. Exercises are built around local Philippine application domains and evaluated via an automated `console.assert` harness.

## Learning Outcomes

1. Handle nullish values and type conversions explicitly without runtime bugs.
2. Maintain context integrity using constructor functions and method chaining (`return this`).
3. Transform array data structures using higher-order functions (`filter`, `map`, `reduce`).
4. Encapsulate state using closures and higher-order functions.
5. Control asynchronous execution flows using Promises and retry strategies.

## Task Specifications

### Module 01: Language Fundamentals (`topics/01_fundamentals.js`)

- Task 1: Barangay Ayuda Eligibility Evaluator (`evaluateAyudaEligibility(citizen)`)
    - Accept citizen object: `{ isSeniorPWD: boolean, isLowIncome: boolean, dependentCount: number|null|undefined }`.
    - Return `true` if `isSeniorPWD === true` OR (`isLowIncome === true` AND `dependentCount >= 3`).
    - If `dependentCount` is `null` or `undefined`, default to `0` using the nullish coalescing operator (`??`).
- Task 2: Jollibee Receipt Bill Calculator (`computeJollibeeBill(rawPrice, isSeniorOrPWD)`)
    - If `isSeniorOrPWD === true`, apply a 20% discount (VAT exempt).
    - If `isSeniorOrPWD === false`, apply 12% VAT (`rawPrice * 1.12`).
    - Return `0` if `rawPrice` is non-numeric, `NaN`, or <= `0`.
    - Return Type: Must return a `Number` rounded to 2 decimal places (e.g., `Number(total.toFixed(2))`).

### Module 02: Objects & Context (`topics/02_objects_and_this.js`)

- Task 1: GCash Wallet Engine (`GCashAccount(accountName, initialBalance)`)
    - Constructor function maintaining internal balance.
    - `cashIn(amount)`: Adds `amount` to balance. Must return `this`.
    - `sendMoney(amount, recipient)`: Deducts `amount + 15` (₱15 transfer fee). If balance is insufficient for `(amount + 15)`, throw an `Error("Insufficient GCash Balance")`. Must return `this`.
    - getBalance(): Returns string formatted as "₱XXX.XX".
- Task 2: Safe Address Extractor (`getBarangayName(resident)`)
    - Read `resident.address.barangay.name` safely using optional chaining (?.).
    - Return `"Unregistered Barangay"` if any intermediate property is missing or `null`.

### Module 03: Data Structures (`topics/03_data_structures.js`)

- Task 1: Sari-Sari Store Sales Aggregator (`summarizeSariSariSales(transactions)`)
    - Filter out transactions where `status === 'voided'` or `status === 'refunded'`.
    - Group total sales per category using `Array.prototype.reduce()`.
    - Return `{ snacks: total, drinks: total, canned: total }`.
- Task 2: Delivery Coverage Extractor (`extractUniqueBarangays(riders)`)
    - Given array of riders with `coveredBarangays` arrays, extract all barangay names, eliminate duplicates using `Set`, and return an alphabetically sorted array.

### Module 04: Advanced Functions (`topics/04_advanced_functions.js`)

- Task 1: Pure Function Memoizer (`memoize(fn)`)
    - Return a wrapper function that caches results based on arguments (`JSON.stringify(args)`). If cached, return without executing `fn`.
- Task 2: Jeepney Fare Matrix Calculator (`createJeepneyFareCalculator(baseFare, discountRate)`)
    - Returns a closure: `(distanceKm, isStudentOrSenior) => number`.
    - Base fare covers up to 4 km. Extra distance adds ₱1.75/km. Use `Math.max(0, distanceKm - 4)` for extra distance.
    - Apply `discountRate` (e.g., 20%) to the calculated total if `isStudentOrSenior === true`. Return rounded `Number`.


### Module 05: Async Mechanics (`topics/05_async_promises.js`)

- Task 1: Resilient GCash Payment Gateway (`retryGcashPayment(paymentFn, retries, delayMs)`)
    - Execute `paymentFn()`. If it throws/rejects, wait `delayMs` and retry up to `retries` times.
    - Return promise resolving with the payment result, or throw the final error if all attempts fail.

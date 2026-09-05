/**
 * [ROLE A] Core Engine Module - Student Starter Template
 */

export function evaluateAyudaEligibility(citizen) {
  // TODO: Implement scoring logic
  // Rules:
  // - Senior Citizen (+35 pts)
  // - PWD (+35 pts)
  // - Monthly Income < 10,000 (+20 pts)
  // - Dependents (+5 pts per dependent, capped at max 20 pts)
  // Priority: score >= 70 -> 'CRITICAL' (approved: true), score >= 40 -> 'HIGH' (approved: true), else -> 'LOW' (approved: false)
  
  return { priority: 'LOW', score: 0, approved: false };
}

export function createReliefPacker(budgetCap = 1000) {
  // TODO: Implement closure/factory function returning an object with methods:
  // - addItem(name, price): checks budget cap, adds item if valid
  // - removeItem(index): removes item by index and adjusts total
  // - getTotal(): returns current total price
  // - getItems(): returns array of items (copy)
  // - getBudgetCap(): returns budget cap
  
  return {
    addItem: (name, price) => ({ success: false, reason: "Not implemented" }),
    removeItem: (index) => {},
    getTotal: () => 0,
    getItems: () => [],
    getBudgetCap: () => budgetCap
  };
}
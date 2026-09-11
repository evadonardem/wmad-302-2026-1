/**
 * [ROLE A] Core Engine Module - Student Starter Template
 */

export function evaluateAyudaEligibility(citizen) {

  let score = 0;

  if (citizen.isSenior === true) { score += 35; }

  if (citizen.isPWD === true) { score += 35; }

  if (citizen.monthlyIncome < 10000) { score += 20; } 

  const dependentCount = citizen.dependentCount ?? 0;
  const dependentPoints = Math.min(dependentCount * 5, 20);

  score += dependentPoints;

  let priority;
  let approved;

  if (score >= 70) {
    priority = 'CRITICAL';
    approved = true;
    } else if (score >= 40) {
      priority = 'HIGH';
      approved = true;
      } else {
        priority = 'LOW';
        approved = false;
        }
    
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
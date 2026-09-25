/**
 * [ROLE A] Core Engine Module - Student Starter Template
 */
export function evaluateAyudaEligibility(citizen) {
  let score = 0;
  let priority = 'LOW';
  let approved = false;
  // TODO: Implement scoring logic
  // Rules:
  // - Senior Citizen (+35 pts)
  // - PWD (+35 pts)
  // - Monthly Income < 10,000 (+20 pts)
  // - Dependents (+5 pts per dependent, capped at max 20 pts)
  // Priority: score >= 70 -> 'CRITICAL' (approved: true), score >= 40 -> 'HIGH' (approved: true), else -> 'LOW' (approved: false)
  if (citizen.ifSeniorCitizen) {
    score += 35;
  }
  if (citizen.ifPWD) {
    score += 35;
  }
  if (citizen.monthlyIncome < 10000) {
    score += 20;
  } else if (citizen.monthlyIncome > 50000 && citizen.dependentCount < 10) {
    score -= 20;
  }
  const dependents = citizen.dependentCount;
  score += Math.min(dependents * 5, 20);
  
  if (score >= 70) {
    priority = 'CRITICAL';
    approved = true;
  } else if (score > 40) {
    priority = 'HIGH';
    approved = true;
  }
  return { priority, score, approved};
}

export function createReliefPacker(budgetCap = 1000) {
  // TODO: Implement closure/factory function returning an object with methods:
  // - addItem(name, price): checks budget cap, adds item if valid
  // - removeItem(index): removes item by index and adjusts total
  // - getTotal(): returns current total price
  // - getItems(): returns array of items (copy)
  // - getBudgetCap(): returns budget cap
  const items = [];
  let total = 0;

  return {
    addItem: (name, price) => {
      if (total + price <= budgetCap) {
        items.push({ name, price });
        total += price;
        return { success: true };
      } else {
        return { success: false, reason: "Budget cap exceeded" };
      }
    },
    removeItem: (index) => {
      if (index >= 0 && index < items.length) {
        total -= items[index].price;
        items.splice(index, 1);
      }
    },
    
    getTotal: () => total,
    getItems: () => [...items], // return a copy of items
    getBudgetCap: () => budgetCap
  };
}
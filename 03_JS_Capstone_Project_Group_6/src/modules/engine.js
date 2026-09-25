/**
 * [ROLE A] Core Engine Module - Student Starter Template
 */


const ifSeniorCitizen = document.getElementById('is-senior');
const ifPWD = document.getElementById('is-pwd');
const monthlyIncome = document.getElementById('monthly-income');
const dependentCount = document.getElementById('dependent-count');
let score = 0;

export function evaluateAyudaEligibility(citizen) {
  // TODO: Implement scoring logic
  // Rules:
  // - Senior Citizen (+35 pts)
  // - PWD (+35 pts)
  // - Monthly Income < 10,000 (+20 pts)
  // - Dependents (+5 pts per dependent, capped at max 20 pts)
  // Priority: score >= 70 -> 'CRITICAL' (approved: true), score >= 40 -> 'HIGH' (approved: true), else -> 'LOW' (approved: false)
  if (ifSeniorCitizen.checked) {
    score += 35;
  }
  if (ifPWD.checked) {
    score += 35;
  }
  if (parseInt(monthlyIncome.value) < 10000) {
    score += 20;
  }
  const dependents = parseInt(dependentCount.value);
  score += Math.min(dependents * 5, 20);
  let priority = 'LOW';
  let approved = false;
  if (score >= 70) {
    priority = 'CRITICAL';
    approved = true;
  } else if (score >= 40) {
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
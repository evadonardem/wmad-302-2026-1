/**
 * [ROLE A] Eligibility & POS Engine Module
 */

export function evaluateAyudaEligibility(citizen) {
  let score = 0;

  // 1. Income Scoring
  const income = citizen.monthlyIncome ?? 0;
  if (income <= 5000) score += 40;
  else if (income <= 10000) score += 30;
  else if (income <= 20000) score += 15;
  else score += 0;

  // 2. Vulnerability Scoring
  if (citizen.isSenior) score += 20;
  if (citizen.isPWD) score += 20;

  // 3. Dependents Scoring
  const dependents = citizen.dependentCount ?? 0;
  score += Math.min(dependents * 5, 20); 

  // 4. Priority Level Assignment
  let priority = 'LOW';
  if (score >= 80) priority = 'CRITICAL';
  else if (score >= 60) priority = 'HIGH';
  else if (score >= 40) priority = 'MEDIUM';

  const approved = score >= 40;

  return {
    score,
    priority,
    approved
  };
}

export function createReliefPacker(budgetCap = 1000) {
  let items = [];
  let cap = budgetCap;

  return {
    addItem(name, price) {
      const currentTotal = items.reduce((sum, item) => sum + item.price, 0);
      if (currentTotal + price > cap) {
        return { success: false, reason: 'Exceeds budget cap!' };
      }
      items.push({ name, price });
      return { success: true };
    },
    removeItem(index) {
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
      }
    },
    getItems() {
      return [...items];
    },
    getTotal() {
      return items.reduce((sum, item) => sum + item.price, 0);
    },
    getBudgetCap() {
      return cap;
    }
  };
}
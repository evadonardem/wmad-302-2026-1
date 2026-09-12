/**
 * [ROLE A] Core Engine Module - Student Starter Template
 */

export function evaluateAyudaEligibility(citizen) {
  let score = 0;

  if (citizen.isSenior === true) {
    score += 35;
  }

  if (citizen.isPWD === true) {
    score += 35;
  }

  if (citizen.monthlyIncome < 10000) {
    score += 20;
  }

  const dependentCount = citizen.dependentCount ?? 0;
  score += Math.min(dependentCount * 5, 20);

  let priority = 'LOW';
  if (score >= 70) {
    priority = 'CRITICAL';
  } else if (score >= 40) {
    priority = 'HIGH';
  }

  const approved = score >= 40;

  return { priority, score, approved };
}

export function createReliefPacker(budgetCap = 1000) {
  let items = [];
  const cap = budgetCap;

  return {
    addItem(name, price) {
      const currentTotal = items.reduce((sum, item) => sum + item.price, 0);
      if (currentTotal + price <= cap) {
        items.push({ name, price });
        return { success: true };
      }
      return { success: false, reason: "Exceeds budget cap" };
    },
    removeItem(index) {
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
      }
    },
    getTotal() {
      return items.reduce((sum, item) => sum + item.price, 0);
    },
    getItems() {
      return [...items];
    },
    getBudgetCap() {
      return cap;
    }
  };
}
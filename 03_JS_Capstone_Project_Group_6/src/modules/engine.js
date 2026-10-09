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

// Relief Packer Factory Function (Implemented)
export function createReliefPacker(budgetCap = 1000) {
  const items = [];
  return {
    addItem(name, price) {
      // Validate inputs
      if (typeof name !== 'string' || name.trim() === '') {
        return { success: false, reason: 'Item name is required' };
      }
      if (typeof price !== 'number' || price <= 0) {
        return { success: false, reason: 'Price must be a positive number' };
      }

      // Check budget before adding
      const currentTotal = this.getTotal();
      if (currentTotal + price > budgetCap) {
        return {
          success: false,
          reason: `Exceeds budget cap (${budgetCap})`
        };
      }

      items.push({name, price});
      return { success: true };
    },

    removeItem(index) {
      if (typeof index !== 'number' || index < 0 || index >= items.length) {
        return { success: false, reason: 'Invalid item index' };
      }
      items.splice(index, 1);
      return { success: true };
    },

    getTotal() {
      return items.reduce((sum, item) => sum + item.price, 0);
    },

    getItems() {
      // Return a copy to prevent external mutation of internal state
      return [...items];
    },

    getBudgetCap() {
      return budgetCap;
    }
  };
}
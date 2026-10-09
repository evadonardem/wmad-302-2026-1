/*
 * [ROLE A] Core Engine Module
 */

export const AYUDA_LIMITS = {
  CRITICAL: 3000,
  HIGH: 1500,
  LOW: 600
};

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

  let priority;
  let approved;

  if (score >= 70) {
    priority = "CRITICAL";
    approved = true;
  } else if (score >= 40) {
    priority = "HIGH";
    approved = true;
  } else {
    priority = "LOW";
    approved = false;
  }

  return {
    priority,
    score,
    approved
  };
}

export function getAyudaLimit(priority) {
  return AYUDA_LIMITS[priority] ?? AYUDA_LIMITS.LOW;
}

export function createReliefPacker(budgetCap = 1000) {
  let items = [];
  let total = 0;

  return {
    addItem(name, price) {
      if (!name || !Number.isFinite(price) || price <= 0) {
        return { success: false, reason: "Invalid item or price" };
      }

      if (total + price > budgetCap) {
        return { success: false, reason: "Budget cap exceeded" };
      }

      const item = { name, price };

      items.push(item);
      total += price;

      return { success: true, item };
    },

    removeItem(index) {
      if (index < 0 || index >= items.length) {
        return { success: false, reason: "Invalid item index" };
      }

      const removedItem = items.splice(index, 1)[0];
      total -= removedItem.price;

      return { success: true, item: removedItem };
    },

    getTotal() {
      return total;
    },

    getItems() {
      return items.map(item => ({ ...item }));
    },

    getBudgetCap() {
      return budgetCap;
    }
  };
}
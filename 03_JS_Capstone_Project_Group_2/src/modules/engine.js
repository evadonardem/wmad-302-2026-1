/**
 * [ROLE A] Core Engine Module
 */

export function evaluateAyudaEligibility(citizen = {}) {
  const seniorPoints = citizen.isSenior === true ? 35 : 0;
  const pwdPoints = citizen.isPWD === true ? 35 : 0;
  const incomePoints = Number(citizen.monthlyIncome) < 10000 ? 20 : 0;
  const dependentCount = citizen.dependentCount ?? 0;
  const dependentPoints = Math.min(Number(dependentCount) * 5, 20);

  const score = seniorPoints + pwdPoints + incomePoints + dependentPoints;

  let priority = 'LOW';
  if (score >= 70) {
    priority = 'CRITICAL';
  } else if (score >= 40) {
    priority = 'HIGH';
  }

  return {
    priority,
    score,
    approved: priority !== 'LOW',
  };
}

export function createReliefPacker(budgetCap = 1000) {
  let items = [];

  const getCurrentTotal = () =>
    items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return {
    addItem(name, price) {
      const itemName = String(name ?? '').trim();
      const itemPrice = Number(price);

      if (!itemName) {
        return { success: false, reason: 'Item name is required.' };
      }

      if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
        return { success: false, reason: 'Price must be a positive number.' };
      }

      const nextTotal = getCurrentTotal() + itemPrice;
      if (nextTotal > budgetCap) {
        return {
          success: false,
          reason: `Remaining budget is ₱${(budgetCap - getCurrentTotal()).toFixed(2)}.`,
        };
      }

      items.push({ name: itemName, price: itemPrice });
      return { success: true, total: getCurrentTotal() };
    },

    removeItem(index) {
      if (!Number.isInteger(index) || index < 0 || index >= items.length) {
        return false;
      }

      items.splice(index, 1);
      return true;
    },

    getTotal() {
      return getCurrentTotal();
    },

    getItems() {
      return items.map((item) => ({ ...item }));
    },

    getBudgetCap() {
      return budgetCap;
    },
  };
}
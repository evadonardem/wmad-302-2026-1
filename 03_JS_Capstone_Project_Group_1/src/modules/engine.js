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

  const dependents = citizen.dependentCount ?? 0;

  score += Math.min(dependents * 5, 20);

  let priority;

  if (score >= 70) {
    priority = "CRITICAL";
  } else if (score >= 40) {
    priority = "HIGH";
  } else {
    priority = "LOW";
  }

  return {
    priority,
    score,
    approved: score >= 40
  };
}

export function createReliefPacker(budgetCap = 1000) {
  const items = [];

  function getTotal() {
    return items.reduce(
      (total, item) => total + item.price,
      0
    );
  }

  return {
    addItem(name, price) {
      if (getTotal() + price > budgetCap) {
        return false;
      }

      items.push({
        name,
        price
      });

      return true;
    },

    removeItem(index) {
      if (
        index >= 0 &&
        index < items.length
      ) {
        items.splice(index, 1);
      }
    },

    getTotal() {
      return getTotal();
    },

    getItems() {
      return items.map((item) => ({
        ...item
      }));
    },

    getBudgetCap() {
      return budgetCap;
    }
  };
}
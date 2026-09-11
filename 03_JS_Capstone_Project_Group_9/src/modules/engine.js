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

  return { priority, score, approved };
}

export function createReliefPacker(budgetCap = 1000) {
  let items = [];

  function getTotal() {
    return items.reduce((sum, item) => sum + item.price, 0);
  }

  function addItem(name, price) {
    const total = getTotal();
    if (total + price > budgetCap) {
      return false;
    }
    items.push({ name, price });
    return true;
  }

  function removeItem(index) {
    if (index < 0 || index >= items.length) {
      return false;
    }
    items.splice(index, 1);
    return true;
  }

  function getItems() {
    return [...items];
  }

  function getBudgetCap() {
    return budgetCap;
  }

  return {
    addItem,
    removeItem,
    getTotal,
    getItems,
    getBudgetCap
  };
}

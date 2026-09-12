/**
 * [ROLE A] Core Engine Module - Student Starter Template
 */
export function evaluateAyudaEligibility(citizen) {
  let score = 0;
  if (citizen.isSenior === true) score += 35;
  if (citizen.isPWD === true) score += 35;
  if (citizen.monthlyIncome < 10000) score += 20;
  
  const dependentCount = citizen.dependentCount ?? 0;
  const dependentPoints = Math.min(dependentCount * 5, 20);
  score += dependentPoints;

  let priority, approved;
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

  // ✅ RETURN the computed values, not hardcoded defaults!
  return { priority, score, approved };
}

export function createReliefPacker(budgetCap = 1000) {
  let items = [];
  let total = 0;

  function addItem(name, price) {
    if (total + price > budgetCap) {
      return { success: false, reason: "Budget limit exceeded" };
    }
    items.push({ name, price });
    total += price;
    return { success: true };
  }

  function removeItem(index) {
    if (index < 0 || index >= items.length) return;
    total -= items[index].price;
    items.splice(index, 1);
  }

  function getTotal() { return total; }
  function getItems() { return items; }

  // ✅ RETURN the REAL functions, not placeholder dummies!
  return {
    addItem,
    removeItem,
    getTotal,
    getItems,
    getBudgetCap: () => budgetCap
  };
}
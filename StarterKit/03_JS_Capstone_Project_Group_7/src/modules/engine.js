/*
 * [ROLE A] Core Engine Module
 */

// Evaluate a citizen's eligibility for ayuda
export function evaluateAyudaEligibility(citizen) {
  let score = 0;

  // Senior Citizen
  if (citizen.isSenior === true) {
    score += 35;
  }

  // Person with Disability
  if (citizen.isPWD === true) {
    score += 35;
  }

  // Low Income
  if (citizen.monthlyIncome < 10000) {
    score += 20;
  }

  // Dependents: +5 points each, maximum of 20 points
  const dependentCount = citizen.dependentCount ?? 0;
  score += Math.min(dependentCount * 5, 20);

  // Determine priority and approval
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


// Create a relief package with a private budget and item list
export function createReliefPacker(budgetCap = 1000) {
  // Private state
  let items = [];
  let total = 0;

  return {
    // Add an item if it does not exceed the budget
    addItem(name, price) {
      if (!name || !Number.isFinite(price) || price <= 0) {
        return {
          success: false,
          reason: "Invalid item or price"
        };
      }

      if (total + price > budgetCap) {
        return {
          success: false,
          reason: "Budget cap exceeded"
        };
      }

      const item = {
        name,
        price
      };

      items.push(item);
      total += price;

      return {
        success: true,
        item
      };
    },

    // Remove an item by index
    removeItem(index) {
      if (index < 0 || index >= items.length) {
        return {
          success: false,
          reason: "Invalid item index"
        };
      }

      const removedItem = items.splice(index, 1)[0];
      total -= removedItem.price;

      return {
        success: true,
        item: removedItem
      };
    },

    // Get current total
    getTotal() {
      return total;
    },

    // Return a copy of the items
    getItems() {
      return items.map(item => ({ ...item }));
    },

    // Get budget limit
    getBudgetCap() {
      return budgetCap;
    }
  };
}
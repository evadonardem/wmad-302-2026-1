import console from 'node:console';

export function evaluateAyudaEligibility(citizen) {
    const dependents = citizen.dependentCount ?? 0;
  return citizen.isSeniorPWD === true || (citizen.isLowIncome === true && dependents >= 3);
  // TODO: Task 1 - Evaluate Ayuda Eligibility using ?? and logical operators
}

export function computeJollibeeBill(rawPrice, isSeniorOrPWD) {
    if (typeof rawPrice !== 'number' || isNaN(rawPrice) || rawPrice <= 0) {
    return 0;
  }

  let total;
  if (isSeniorOrPWD === true) {
    total = rawPrice * 0.80; // 20% discount
  } else {
    total = rawPrice * 1.12; // 12% VAT
  }

  return Number(total.toFixed(2));
  // TODO: Task 2 - Compute bill returning rounded Number (e.g., Number(total.toFixed(2)))
}

export function runFundamentalsTests() {
  // Task 1 Assertions
  console.assert(evaluateAyudaEligibility({ isSeniorPWD: true, isLowIncome: false, dependentCount: 0 }) === true, 'Senior should qualify');
  console.assert(evaluateAyudaEligibility({ isSeniorPWD: false, isLowIncome: true, dependentCount: 3 }) === true, 'Low income w/ 3 dependents qualifies');
  console.assert(evaluateAyudaEligibility({ isSeniorPWD: false, isLowIncome: true, dependentCount: null }) === false, 'Null dependents should default to 0');

  // Task 2 Assertions
  console.assert(computeJollibeeBill(100, true) === 80.00, 'Senior gets 20% off');
  console.assert(computeJollibeeBill(100, false) === 112.00, 'Regular gets 12% VAT');
  console.assert(computeJollibeeBill('invalid', false) === 0, 'Invalid price returns 0');
  console.log('  └─ Module 01 assertions passed.');
}
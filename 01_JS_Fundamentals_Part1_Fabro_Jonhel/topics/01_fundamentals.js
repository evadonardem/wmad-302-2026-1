import console from 'node:console';

export function evaluateAyudaEligibility(citizen) {
  // TODO: Task 1 - Evaluate Ayuda Eligibility using ?? and logical operators
  let isSeniorPWD = citizen.isSeniorPWD;
  let isLowIncome = citizen.isLowIncome;
  let dependentCount = citizen.dependentCount;

  if (dependentCount === null || dependentCount === undefined) {
    dependentCount = 0;
  }

  if (isSeniorPWD === true) {
    return true;
  }

  if (isLowIncome === true && dependentCount >= 3) {
    return true;
  } else {
    return false;
  }
}

export function computeJollibeeBill(rawPrice, isSeniorOrPWD) {
  // TODO: Task 2 - Compute bill returning rounded Number (e.g., Number(total.toFixed(2)))
  if (typeof rawPrice !== 'number') {
    return 0;
  }
  if (isNaN(rawPrice)) {
    return 0;
  }
  if (rawPrice <= 0) {
    return 0;
  }

  let total = 0;

  if (isSeniorOrPWD === true) {
    total = rawPrice * 0.8;
  } else {
    total = rawPrice * 1.12;
  }

  let formattedString = total.toFixed(2);
  let finalAmount = Number(formattedString);

  return finalAmount;
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
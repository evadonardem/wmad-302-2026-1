import console from 'node:console';

export function evaluateAyudaEligibility(citizen) {
  return citizen.isSeniorPWD || citizen.isLowIncome && (citizen.dependentCount ?? 0) >= 3;
}

export function computeJollibeeBill(rawPrice, isSeniorOrPWD) {
  if (isNaN(rawPrice) || rawPrice <= 0) {
    return 0;
  }

  let bill;
  if (isSeniorOrPWD) {
    bill = rawPrice - rawPrice * .20;
  } else {
    bill = rawPrice * 1.12;
  }

  return Number(bill.toFixed(2));
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
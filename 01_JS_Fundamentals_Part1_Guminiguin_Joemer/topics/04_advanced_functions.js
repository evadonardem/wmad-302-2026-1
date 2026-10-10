import console from 'node:console';

export function memoize(fn) {
  // TODO: Cache evaluation results in a local object closure
}

export function createJeepneyFareCalculator(baseFare = 13, discountRate = 0.20) {
  // TODO: Return closure (distanceKm, isStudentOrSenior) calculating fare
}

export function runAdvancedFunctionsTests() {
  let execCount = 0;
  const calc = memoize((a, b) => { execCount++; return a + b; });
  calc(2, 3);
  calc(2, 3);
  console.assert(execCount === 1, 'Memoized function executed only once for same arguments');

  const fareCalc = createJeepneyFareCalculator(13, 0.20);
  console.assert(fareCalc(2, false) === 13.00, '2km trip regular fare is base fare 13');
  console.assert(fareCalc(6, false) === 16.50, '6km trip regular fare is 13 + (2 * 1.75) = 16.50');
  console.assert(fareCalc(6, true) === 13.20, '6km trip senior fare is 16.50 * 0.8 = 13.20');
  console.log('  └─ Module 04 assertions passed.');
}
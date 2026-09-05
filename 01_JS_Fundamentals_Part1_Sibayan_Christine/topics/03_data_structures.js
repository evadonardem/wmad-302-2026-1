import console from 'node:console';

export function summarizeSariSariSales(transactions) {
  return transactions.reduce((acc, t) => {
    if (t.status !== 'voided' && t.status !== 'refunded') {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    }
    return acc;
  }, { snacks: 0, drinks: 0, canned: 0 });}

export function extractUniqueBarangays(riders) {
  return [...new Set(riders.flatMap(r => r.coveredBarangays))].sort();
}

export function runDataStructuresTests() {
  const txs = [
    { category: 'snacks', amount: 50, status: 'completed' },
    { category: 'drinks', amount: 30, status: 'completed' },
    { category: 'snacks', amount: 20, status: 'voided' },
    { category: 'canned', amount: 40, status: 'completed' }
  ];
  const summary = summarizeSariSariSales(txs);
  console.assert(summary.snacks === 50 && summary.drinks === 30 && summary.canned === 40, 'Sales summarized correctly');

  const riders = [
    { id: 1, coveredBarangays: ['Irisan', 'Loakan'] },
    { id: 2, coveredBarangays: ['Loakan', 'Bakakeng'] }
  ];
  const unique = extractUniqueBarangays(riders);
  console.assert(JSON.stringify(unique) === JSON.stringify(['Bakakeng', 'Irisan', 'Loakan']), 'Sorted unique barangays extracted');
  console.log('  └─ Module 03 assertions passed.');
}
import console from 'node:console';

export function summarizeSariSariSales(transactions) {
  // TODO: Filter out 'voided'/'refunded' and reduce by category
  const validTransactions = transactions.filter(function (tx) {
    return tx.status !== 'voided' && tx.status !== 'refunded';
  });

  const summary = validTransactions.reduce(function (acc, tx) {
    const category = tx.category;
    const amount = tx.amount;

    if (!acc[category]) {
      acc[category] = 0;
    }

    acc[category] = acc[category] + amount;
    return acc;
  }, {});

  return summary;
}

export function extractUniqueBarangays(riders) {
  // TODO: Extract all barangays, deduplicate via Set, and sort alphabetically
  const allBarangays = [];

  riders.forEach(function (rider) {
    rider.coveredBarangays.forEach(function (barangay) {
      allBarangays.push(barangay);
    });
  });

  const uniqueBarangaysSet = new Set(allBarangays);
  const uniqueBarangaysArray = Array.from(uniqueBarangaysSet);

  uniqueBarangaysArray.sort();

  return uniqueBarangaysArray;
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
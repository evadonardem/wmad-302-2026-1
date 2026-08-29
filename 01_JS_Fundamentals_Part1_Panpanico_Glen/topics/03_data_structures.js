import console from 'node:console';

export function summarizeSariSariSales(transactions) {
      // Remove voided and refunded transactions
    const validTransactions = transactions.filter(function(transaction) {
        return transaction.status !== 'voided' &&
               transaction.status !== 'refunded';
    });

   
    const summary = validTransactions.reduce(function(result, transaction) {

        const category = transaction.category;
        const amount = transaction.amount;

       
        if (result[category] === undefined) {
            result[category] = 0;
        }

        result[category] = result[category] + amount;

        return result;

    }, {});

    return summary;
}
  // TODO: Filter out 'voided'/'refunded' and reduce by category

export function extractUniqueBarangays(riders) {
  
    // Create an empty array
    const barangays = [];

   
    riders.forEach(function(rider) {

        rider.coveredBarangays.forEach(function(barangay) {
            barangays.push(barangay);
        });

    });

   
    const uniqueBarangays = [...new Set(barangays)];

    uniqueBarangays.sort();

    return uniqueBarangays;
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
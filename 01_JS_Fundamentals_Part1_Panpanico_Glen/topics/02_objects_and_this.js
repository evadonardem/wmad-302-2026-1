import console from 'node:console';

export function GCashAccount(accountName, initialBalance = 0) {
  this.accountName = accountName;
  this.balance = initialBalance;
this.cashIn = function(amount) {
        this.balance = this.balance + amount;
        return this;
    };
  // TODO: Implement cashIn(amount), sendMoney(amount, recipient), and getBalance()
}

export function getBarangayName(resident) {
      const barangayName = resident?.address?.barangay?.name;

    // If no barangay name exists, return this message
    if (barangayName === undefined) {
        return 'Unregistered Barangay';
    }

    return barangayName;
}
  // TODO: Use optional chaining resident?.address?.barangay?.name


export function runObjectsTests() {
  const wallet = new GCashAccount('Juan', 500);
  wallet.cashIn(200).sendMoney(100, 'Maria');
  console.assert(wallet.getBalance() === '₱585.00', 'Balance should be 500 + 200 - 100 - 15 fee = 585');

  try {
    wallet.sendMoney(1000, 'Pedro');
    console.assert(false, 'Should have thrown error for insufficient balance');
  } catch (e) {
    console.assert(e.message === 'Insufficient GCash Balance', 'Error message matches');
  }

  console.assert(getBarangayName({ address: { barangay: { name: 'Bakakeng Central' } } }) === 'Bakakeng Central', 'Reads valid barangay');
  console.assert(getBarangayName({}) === 'Unregistered Barangay', 'Handles missing property gracefully');
  console.log('  └─ Module 02 assertions passed.');
}
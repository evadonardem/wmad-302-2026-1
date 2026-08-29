import console from 'node:console';

export function GCashAccount(accountName, initialBalance = 0) {
  this.accountName = accountName;
  this.balance = initialBalance;

  // TODO: Implement cashIn(amount), sendMoney(amount, recipient), and getBalance()
  this.cashIn = function (amount) {
    this.balance = this.balance + amount;
    return this;
  };

  this.sendMoney = function (amount, recipient) {
    const totalDeduction = amount + 15;

    if (this.balance < totalDeduction) {
      throw new Error('Insufficient GCash Balance');
    }

    this.balance = this.balance - totalDeduction;
    return this;
  };

  this.getBalance = function () {
    const formattedBalance = this.balance.toFixed(2);
    return '₱' + formattedBalance;
  };
}
export function getBarangayName(resident) {
  // TODO: Use optional chaining resident?.address?.barangay?.name
  const barangayName = resident?.address?.barangay?.name;

  if (barangayName === undefined || barangayName === null) {
    return 'Unregistered Barangay';
  } else {
    return barangayName;
  }
}

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
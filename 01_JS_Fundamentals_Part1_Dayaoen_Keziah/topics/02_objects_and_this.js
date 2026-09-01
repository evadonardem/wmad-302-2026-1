import console from 'node:console';

export function GCashAccount(accountName, initialBalance = 0) {
  this.accountName = accountName;
  this.balance = initialBalance;

  // TODO: Implement cashIn(amount), sendMoney(amount, recipient), and getBalance()
  this.cashIn = function(amount) {
    if (amount <= 0) {
      throw new Error('Cash-in amount must be positive');
    }
    this.balance += amount;
    return this; // Enable method chaining
  };

  this.sendMoney = function(amount, recipient) {
    const fee = 15; // Fixed transaction fee
    if (amount + fee > this.balance) {
      throw new Error('Insufficient GCash Balance');
    }
    this.balance -= (amount + fee);
    return this; // Enable method chaining
  };

  this.getBalance = function() {
    return `₱${this.balance.toFixed(2)}`;
  };
}

export function getBarangayName(resident) {
  // TODO: Use optional chaining resident?.address?.barangay?.name
  return resident?.address?.barangay?.name ?? 'Unregistered Barangay';
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
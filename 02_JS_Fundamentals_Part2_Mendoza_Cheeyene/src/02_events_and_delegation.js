export function initSariSariPOS() {
  const posContainer = document.getElementById('pos-register');
  const billTotalEl = document.getElementById('bill-total');
  let currentTotal = 0;

  if (!posContainer) return;

  posContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // 1. Get the action and amount from the button
    const action = btn.dataset.action;
    const amount = parseFloat(btn.dataset.amount) || 0; // handle invalid/empty as 0

    // 2. Update total based on action
    if (action === 'add') {
      currentTotal += amount;
    } else if (action === 'clear') {
      currentTotal = 0;
    }

    // 3. Update display formatted as ₱XX.XX
    billTotalEl.textContent = `₱${currentTotal.toFixed(2)}`;
  });
}
export function initSariSariPOS() {
  const posContainer = document.getElementById('pos-register');
  const billTotalEl = document.getElementById('bill-total');
  let currentTotal = 0;

  if (!posContainer) return;

  // Single-listener event delegation
  posContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // TODO:
    // 1. Read btn.dataset.action ('add' or 'clear')
    // 2. Update currentTotal state
    // 3. Update billTotalEl textContent formatted as ₱XX.XX

    const action = btn.dataset.action;

    if (action === 'add') {
      currentTotal += Number(btn.dataset.amount);
    } else if (action === 'clear') {
      currentTotal = 0;
    }

    billTotalEl.textContent = `₱${currentTotal.toFixed(2)}`;
  });
}
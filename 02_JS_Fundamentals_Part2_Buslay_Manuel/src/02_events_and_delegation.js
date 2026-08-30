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
  
    if (action === 'add') {
      const amount = Number(btn.dataset.amount) || 0;
      currentTotal += amount;
    } else if (action === 'clear') {
      currentTotal = 0;
    }

    if (billTotalEl) {
      billTotalEl.textContent = `₱${currentTotal.toFixed(2)}`;
    }
  });
}
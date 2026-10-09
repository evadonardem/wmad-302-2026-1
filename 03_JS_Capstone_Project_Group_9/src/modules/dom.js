/**
 * [ROLE B] DOM & UI Module - Student Starter Template
 */

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function renderResidentCards(container, residents) {
  if (residents.length === 0) {
    container.innerHTML = '<p class="empty-state">No residents in the queue.</p>';
    return;
  }

  container.innerHTML = residents.map(resident => {
    const priorityClass = resident.priority.toLowerCase();
    const statusClass = resident.approved ? 'approved' : 'pending';
    const statusLabel = resident.approved ? 'Approved' : 'Not Approved';
    const initial = sanitizeHTML(resident.name.trim().charAt(0).toUpperCase() || '?');

    return `
    <div class="resident-card" data-priority="${resident.priority}">
      <div class="resident-avatar ${priorityClass}">${initial}</div>
      <div class="resident-card-info">
        <h3>${sanitizeHTML(resident.name)}</h3>
        <div class="resident-card-meta">
          <span class="badge ${priorityClass}">${resident.priority}</span>
          <span class="status-pill ${statusClass}">${statusLabel}</span>
          <span class="resident-score">Score: ${resident.score}</span>
        </div>
      </div>
      <button class="icon-btn" data-action="remove-resident" data-id="${resident.id}" title="Remove" aria-label="Remove ${sanitizeHTML(resident.name)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
        </svg>
      </button>
    </div>
  `;
  }).join('');
}
export function renderPOSRegister(container, packerState) {
  const items = packerState.getItems();
  const total = packerState.getTotal();
  const budgetCap = packerState.getBudgetCap();
  const percentUsed = (total / budgetCap) * 100;

  const itemsList = items.map((item, index) => `
    <li>
      ${sanitizeHTML(item.name)} - ₱${item.price}
      <button data-action="remove-item" data-id="${index}">Remove</button>
    </li>
  `).join('');

  container.innerHTML = `
    <ul class="pos-items">${itemsList}</ul>
    <p>Subtotal: ₱${total} / ₱${budgetCap}</p>
    <progress value="${total}" max="${budgetCap}"></progress>
  `;
}

/**
 * Renders the overview dashboard: totals by priority and % of relief
 * budget used. New export — does not affect existing dom.js usage.
 */
export function renderDashboardStats(stats, packerState) {
  const counts = { CRITICAL: 0, HIGH: 0, LOW: 0 };
  stats.forEach(resident => {
    counts[resident.priority] = (counts[resident.priority] || 0) + 1;
  });

  const total = packerState.getTotal();
  const budgetCap = packerState.getBudgetCap();
  const percentUsed = budgetCap > 0 ? Math.round((total / budgetCap) * 100) : 0;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('stat-total', stats.length);
  setText('stat-critical', counts.CRITICAL);
  setText('stat-high', counts.HIGH);
  setText('stat-low', counts.LOW);
  setText('stat-budget', `${percentUsed}%`);
}

/**
 * Shows a short-lived toast notification instead of a blocking alert().
 * type: 'info' | 'success' | 'error'
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    // Fallback if the toast container isn't in the page.
    alert(message);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

export function setupActionDelegation(rootElement, actionMap) {
  rootElement.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (actionMap[action]) {
      actionMap[action](id, target);
    }
  });
}
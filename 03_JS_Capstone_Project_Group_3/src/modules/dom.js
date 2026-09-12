/**
 * [ROLE B] DOM & UI Module
 */

export function sanitizeHTML(str) {
  const safeValue = str == null ? '' : String(str);
  const temp = document.createElement('div');
  temp.textContent = safeValue;
  return temp.innerHTML;
}

export function renderResidentCards(container, residents) {
  if (!container) return;

  if (!Array.isArray(residents) || residents.length === 0) {
    container.innerHTML = '<div class="empty-state">No residents in queue yet.</div>';
    return;
  }

  const cards = residents
    .map((resident) => {
      const priority = resident.priority || 'LOW';
      const name = sanitizeHTML(resident.name || 'Unknown resident');
      const province = sanitizeHTML(resident.province || 'N/A');
      const city = sanitizeHTML(resident.city || 'N/A');
      const barangay = sanitizeHTML(resident.barangay || 'N/A');
      const score = sanitizeHTML(String(resident.score ?? 0));
      const id = sanitizeHTML(String(resident.id ?? ''));
      const approvedText = resident.approved ? 'Approved' : 'Pending';

      return `
        <article class="resident-card" data-priority="${priority}">
          <div class="resident-header">
            <div>
              <h3>${name}</h3>
              <p>Brgy. ${barangay}, ${city}, ${province}</p>
            </div>
            <span class="badge ${priority.toLowerCase()}">${priority}</span>
          </div>
          <div class="resident-meta">
            <span>Score: ${score}</span>
            <span>${approvedText}</span>
          </div>
          <button type="button" class="btn btn-secondary" data-action="remove-resident" data-id="${id}">
            Remove
          </button>
        </article>
      `;
    })
    .join('');

  container.innerHTML = cards;
}

export function renderPOSRegister(container, packerState) {
  if (!container || !packerState) return;

  const items = packerState.getItems ? packerState.getItems() : [];
  const subtotal = packerState.getTotal ? packerState.getTotal() : 0;
  const budgetCap = packerState.getBudgetCap ? packerState.getBudgetCap() : 0;
  const remaining = Math.max(budgetCap - subtotal, 0);

  const itemMarkup = items.length
    ? items
        .map(
          (item, index) => `
            <li class="pos-item">
              <span>${sanitizeHTML(item.name)}</span>
              <span>₱${Number(item.price || 0).toFixed(2)}</span>
              <button type="button" class="btn btn-remove" data-action="remove-pos-item" data-index="${index}">Remove</button>
            </li>
          `,
        )
        .join('')
    : '<li class="pos-empty">No items in the relief pack yet.</li>';

  container.innerHTML = `
    <div class="pos-summary">
      <div>
        <span>Subtotal</span>
        <strong>₱${Number(subtotal).toFixed(2)}</strong>
      </div>
      <div>
        <span>Remaining</span>
        <strong>₱${Number(remaining).toFixed(2)}</strong>
      </div>
      <div>
        <span>Budget Cap</span>
        <strong>₱${Number(budgetCap).toFixed(2)}</strong>
      </div>
    </div>
    <progress max="${budgetCap}" value="${subtotal}"></progress>
    <ul class="pos-list">${itemMarkup}</ul>
  `;
}

export function setupActionDelegation(rootElement, actionMap) {
  if (!rootElement || !actionMap || typeof actionMap !== 'object') return;

  rootElement.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;

    const actionName = trigger.dataset.action;
    if (!actionName || typeof actionMap[actionName] !== 'function') return;

    actionMap[actionName](event, trigger);
  });
}
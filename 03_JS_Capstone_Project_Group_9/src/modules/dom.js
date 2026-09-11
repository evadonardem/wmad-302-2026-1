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

  container.innerHTML = residents.map(resident => `
    <div class="resident-card" data-priority="${resident.priority}">
      <h3>${sanitizeHTML(resident.name)}</h3>
      <p>Score: ${resident.score} | Priority: ${resident.priority}</p>
      <button data-action="remove-resident" data-id="${resident.id}">Remove</button>
    </div>
  `).join('');
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
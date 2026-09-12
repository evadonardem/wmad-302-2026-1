/**
 * [ROLE B] DOM & UI Module - Student Starter Template
 */

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function renderResidentCards(container, residents) {
  // TODO: Render resident cards into container. 
  // Handle empty state if residents array is empty.
  // Include data-action="remove-resident" and data-id attributes on delete buttons.
  if (residents.length === 0) {
    container.innerHTML = '<p>No residents in the queue.</p>';
    return;
  }

  container.innerHTML = residents.map((resident) => `
    <div class="resident-card" data-priority="${sanitizeHTML(resident.priority)}">
      <h3>${sanitizeHTML(resident.name)}</h3>
      <p>Priority: ${sanitizeHTML(resident.priority)}</p>
      <p>Score: ${sanitizeHTML(String(resident.score))}</p>
      <button 
        data-action="remove-resident" 
        data-id="${sanitizeHTML(String(resident.id))}">
        Remove
      </button>
    </div>
  `).join('');
}

export function renderPOSRegister(container, packerState) {
  // TODO: Render POS register showing subtotal, budget cap, <progress> bar, and item list with remove buttons.
    const total = packerState.getTotal();
    const budgetCap = packerState.getBudgetCap();
    const items = packerState.getItems();
    const remaining = budgetCap - total;

    container.innerHTML = `
    <div class="pos-register">
      <p>Subtotal: ₱${total.toFixed(2)}</p>
      <p>Remaining Budget: ₱${remaining.toFixed(2)}</p>

      <progress value="${total}" max="${budgetCap}"></progress>

      <ul>
        ${items.map((item, index) => `
          <li>
            ${sanitizeHTML(item.name)} - ₱${item.price.toFixed(2)}
            <button 
              data-action="remove-item" 
              data-id="${index}">
              Remove
            </button>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

export function setupActionDelegation(rootElement, actionMap) {
  // TODO: Implement event delegation on rootElement for elements with [data-action].
  rootElement.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');

    if (!target) {
      return;
    }

    const action = target.dataset.action;
    const handler = actionMap[action];

    if (handler) {
      handler(target.dataset.id, e);
    }
  });
}
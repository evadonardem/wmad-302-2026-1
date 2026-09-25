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

   if (!container) return;

  if (!Array.isArray(residents) || residents.length === 0) {
    container.innerHTML = '<p class="empty-state">No residents evaluated or registered in the queue yet.</p>';
    return;
  }

  container.innerHTML = residents
    .map((resident) => {
      const priority = resident.priority ?? 'LOW';
      const safeName = sanitizeHTML(resident.name);
      const safeCity = sanitizeHTML(resident.cityName);
      const safeProvince = sanitizeHTML(resident.provinceName);
      const income = Number(resident.monthlyIncome) || 0;

      return `
        <article class="resident-card" data-priority="${priority}" style="border-color: ${priority === 'CRITICAL' ? 'red' : priority === 'HIGH' ? 'orange' : 'blue'};">
          <div class="resident-card-header">
            <strong>${safeName}</strong>
            <span class="badge ${priority.toLowerCase()}">${priority}</span>
          </div>
          <p>${safeCity}, ${safeProvince}</p>
          <p>Monthly Income: ₱${income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          <p>Dependents: ${resident.dependentCount ?? 0} &middot; Score: ${resident.score ?? 0} pts</p>
          <button
            type="button"
            class="btn-delete-queue"
            data-action="remove-resident"
            data-id="${resident.id}"

            style="
            width: 100px; 
            height: 30px;
            border-radius: 5px;
            background-color: white;
            transition: background-color 0.3s ease-in-out, color 0.4s ease-in-out;
            "
            onmouseover="this.style.backgroundColor='darkred'; this.style.color='white';"
            onmouseout="this.style.backgroundColor='white'; this.style.color='black';"
          >
            Remove
          </button>
        </article>
      `;
    })
  .join('');
}

export function renderPOSRegister(container, packerState) {
  // TODO: Render POS register showing subtotal, budget cap, <progress> bar, and item list with remove buttons.

   if (!container) return;

  const { items = [], total = 0, budgetCap = 5000 } = packerState || {};
  const remaining = budgetCap - total;
  const progressValue = Math.min(total, budgetCap);

  const itemRows = items.length
    ? items
        .map(
          (item, index) => `
            <li class="pos-item">
              <span class="pos-item-name">${sanitizeHTML(item.name)}</span>
              <span class="pos-item-price">₱${Number(item.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              <button
                type="button"
                class="btn-remove-item"
                data-action="remove-item"
                data-index="${index}"
                aria-label="Remove ${sanitizeHTML(item.name)}"
              >
                ✕
              </button>
            </li>
          `
        )
        .join('')
    : '<li class="empty-state">No items in relief pack yet.</li>';

  container.innerHTML = `
    <ul class="pos-item-list">${itemRows}</ul>
    <div class="pos-summary">
      <div class="pos-summary-row">
        <span>Subtotal</span>
        <strong>₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div class="pos-summary-row">
        <span>Budget Cap</span>
        <span>₱${budgetCap.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="pos-summary-row">
        <span>Remaining</span>
        <span class="${remaining < 0 ? 'text-danger' : ''}">₱${remaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
      </div>
      <progress value="${progressValue}" max="${budgetCap || 1}"></progress>
    </div>
  `;
}

export function setupActionDelegation(rootElement, actionMap) {
  // TODO: Implement event delegation on rootElement for elements with [data-action].
   if (!rootElement || typeof actionMap !== 'object') return;

  rootElement.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger || !rootElement.contains(trigger)) return;

    const action = trigger.dataset.action;
    const handler = actionMap[action];

    if (typeof handler === 'function') {
      handler(trigger, event);
    }
  });
}
/*
 * [ROLE B] DOM & UI Module
 */

// Sanitize text before inserting it into HTML
export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}


// Render registered residents into the queue
export function renderResidentCards(container, residents) {
  // Empty state
  if (!residents || residents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No registered residents yet.
      </div>
    `;
    return;
  }

  container.innerHTML = residents.map(resident => {
    const priority = sanitizeHTML(String(resident.priority ?? "LOW"));

    return `
      <article
        class="resident-card"
        data-priority="${priority}"
      >
        <div class="resident-info">
          <h3>${sanitizeHTML(String(resident.name ?? "Unknown Resident"))}</h3>

          <p>
            <strong>Province:</strong>
            ${sanitizeHTML(String(resident.province ?? "N/A"))}
          </p>

          <p>
            <strong>City/Municipality:</strong>
            ${sanitizeHTML(String(resident.city ?? "N/A"))}
          </p>

          <p>
            <strong>Score:</strong>
            ${sanitizeHTML(String(resident.score ?? 0))}
          </p>

          <p>
            <strong>Status:</strong>
            ${resident.approved ? "Approved" : "Not Approved"}
          </p>

          <span class="badge ${priority.toLowerCase()}">
            ${priority}
          </span>
        </div>

        <button
          type="button"
          class="btn"
          data-action="remove-resident"
          data-id="${sanitizeHTML(String(resident.id ?? ""))}"
        >
          Remove
        </button>
      </article>
    `;
  }).join('');
}


// Render Relief Package POS Register
export function renderPOSRegister(container, packerState) {
  const items = packerState.getItems();
  const total = packerState.getTotal();
  const budgetCap = packerState.getBudgetCap();

  const remaining = Math.max(0, budgetCap - total);

  const progress = budgetCap > 0
    ? Math.min(100, (total / budgetCap) * 100)
    : 0;

  container.innerHTML = `
    <div class="pos-summary">

      <p>
        <strong>Subtotal:</strong>
        ₱${total.toFixed(2)}
      </p>

      <p>
        <strong>Budget Cap:</strong>
        ₱${budgetCap.toFixed(2)}
      </p>

      <p>
        <strong>Remaining Budget:</strong>
        ₱${remaining.toFixed(2)}
      </p>

      <progress
        value="${total}"
        max="${budgetCap}"
      ></progress>

      <p class="pos-progress">
        ${progress.toFixed(0)}% of budget used
      </p>

    </div>

    <div class="pos-items">

      ${
        items.length === 0
          ? `
            <div class="empty-state">
              No items added yet.
            </div>
          `
          : items.map((item, index) => `
              <div class="pos-item">

                <span>
                  ${sanitizeHTML(String(item.name))}
                  — ₱${Number(item.price).toFixed(2)}
                </span>

                <button
                  type="button"
                  class="btn"
                  data-action="remove-item"
                  data-index="${index}"
                >
                  Remove
                </button>

              </div>
            `).join('')
      }

    </div>
  `;
}


// Event delegation for buttons/actions
export function setupActionDelegation(rootElement, actionMap) {
  rootElement.addEventListener('click', (e) => {

    const actionElement = e.target.closest('[data-action]');

    if (!actionElement) {
      return;
    }

    const actionName = actionElement.dataset.action;
    const actionHandler = actionMap[actionName];

    if (typeof actionHandler === 'function') {
      actionHandler(actionElement, e);
    }
  });
}
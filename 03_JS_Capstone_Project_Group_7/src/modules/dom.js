/*
 * [ROLE B] DOM & UI Module
 */

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}


// =========================================
// RENDER REGISTERED RESIDENTS
// =========================================

export function renderResidentCards(container, residents) {

  if (!residents || residents.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        No registered residents yet.
      </div>
    `;

    return;
  }

  container.innerHTML = residents.map(resident => {

    const priority = sanitizeHTML(
      String(resident.priority ?? "LOW")
    );

    const ayudaItems = Array.isArray(resident.ayudaItems)
      ? resident.ayudaItems
      : [];

    const ayudaTotal = Number(resident.ayudaTotal ?? 0);
    const ayudaLimit = Number(resident.ayudaLimit ?? 0);
    const ayudaRemaining = Math.max(0, ayudaLimit - ayudaTotal);

    const percentUsed = ayudaLimit > 0
      ? Math.min(100, (ayudaTotal / ayudaLimit) * 100)
      : 0;

    return `

      <article
        class="resident-card"
        data-priority="${priority}"
        data-resident-id="${sanitizeHTML(String(resident.id ?? ""))}"
      >

        <header class="rc-head">

          <h3 class="rc-name">
            ${sanitizeHTML(String(resident.name ?? "Unknown Resident"))}
          </h3>

          <div class="rc-tags">
            <span class="rc-tag rc-tag-priority rc-tag-${priority.toLowerCase()}">
              ${priority}
            </span>
            <span class="rc-tag rc-tag-status ${resident.approved ? 'rc-tag-approved' : 'rc-tag-pending'}">
              ${resident.approved ? "Approved" : "Not Approved"}
            </span>
          </div>

        </header>


        <div class="rc-chips">

          <span class="rc-chip">
            <span class="rc-chip-label">📍</span>
            ${sanitizeHTML(String(resident.city ?? "N/A"))}, ${sanitizeHTML(String(resident.province ?? "N/A"))}
          </span>

          <span class="rc-chip">
            <span class="rc-chip-label">₱</span>
            ${Number(resident.monthlyIncome ?? 0).toFixed(2)} / month
          </span>

          <span class="rc-chip">
            <span class="rc-chip-label">👥</span>
            ${Number(resident.dependentCount ?? 0)} dependent${Number(resident.dependentCount ?? 0) === 1 ? "" : "s"}
          </span>

          ${resident.isSenior ? `
            <span class="rc-chip rc-chip-accent">
              <span class="rc-chip-label">★</span> Senior
            </span>
          ` : ""}

          ${resident.isPWD ? `
            <span class="rc-chip rc-chip-accent">
              <span class="rc-chip-label">◆</span> PWD
            </span>
          ` : ""}

          <span class="rc-chip rc-chip-score">
            Score: <strong>${sanitizeHTML(String(resident.score ?? 0))}</strong>
          </span>

        </div>


        <div class="rc-aid">

          <div class="rc-aid-head">
            <span>Ayuda Record</span>
            <span class="rc-aid-percent">${percentUsed.toFixed(0)}% used</span>
          </div>

          <div class="rc-aid-stats">

            <div class="rc-aid-stat">
              <span class="rc-aid-label">Maximum</span>
              <strong>₱${ayudaLimit.toFixed(2)}</strong>
            </div>

            <div class="rc-aid-stat">
              <span class="rc-aid-label">Given</span>
              <strong>₱${ayudaTotal.toFixed(2)}</strong>
            </div>

            <div class="rc-aid-stat rc-aid-stat-highlight">
              <span class="rc-aid-label">Available</span>
              <strong>₱${ayudaRemaining.toFixed(2)}</strong>
            </div>

          </div>

          ${
            ayudaItems.length === 0
            ? ""
            : `
              <details class="rc-aid-items">
                <summary>
                  <span>${ayudaItems.length} item${ayudaItems.length === 1 ? "" : "s"} received</span>
                  <span class="rc-aid-chevron">▾</span>
                </summary>
                <ul>
                  ${ayudaItems.map(item => `
                    <li>
                      <span>${sanitizeHTML(String(item.name))}</span>
                      <span>₱${Number(item.price).toFixed(2)}</span>
                    </li>
                  `).join('')}
                </ul>
              </details>
            `
          }

        </div>


        <div class="rc-actions">

          <button
            type="button"
            class="btn btn-primary"
            data-action="edit-resident"
            data-id="${sanitizeHTML(String(resident.id ?? ""))}"
          >Edit</button>

          <button
            type="button"
            class="btn"
            data-action="remove-resident"
            data-id="${sanitizeHTML(String(resident.id ?? ""))}"
          >Remove</button>

        </div>

      </article>

    `;

  }).join('');
}


// =========================================
// EDIT RESIDENT
// =========================================

export function renderResidentEditForm(card, resident) {

  card.innerHTML = `

    <div class="resident-edit-form">

      <h3>Edit Resident</h3>

      <label>
        Full Name
        <input type="text" class="edit-name"
          value="${sanitizeHTML(String(resident.name ?? ""))}" />
      </label>

      <label>
        Province
        <input type="text" class="edit-province"
          value="${sanitizeHTML(String(resident.province ?? ""))}" />
      </label>

      <label>
        City / Municipality
        <input type="text" class="edit-city"
          value="${sanitizeHTML(String(resident.city ?? ""))}" />
      </label>

      <label>
        Monthly Income
        <input type="number" class="edit-income"
          value="${Number(resident.monthlyIncome ?? 0)}" min="0" />
      </label>

      <label class="edit-checkbox">
        <input type="checkbox" class="edit-senior"
          ${resident.isSenior ? "checked" : ""} />
        Senior Citizen
      </label>

      <label class="edit-checkbox">
        <input type="checkbox" class="edit-pwd"
          ${resident.isPWD ? "checked" : ""} />
        Person with Disability (PWD)
      </label>

      <label>
        Number of Dependents
        <input type="number" class="edit-dependents"
          value="${Number(resident.dependentCount ?? 0)}" min="0" />
      </label>

      <div class="rc-actions">

        <button
          type="button"
          class="btn btn-primary"
          data-action="save-resident"
          data-id="${sanitizeHTML(String(resident.id ?? ""))}"
        >Save Changes</button>

        <button
          type="button"
          class="btn"
          data-action="cancel-edit"
          data-id="${sanitizeHTML(String(resident.id ?? ""))}"
        >Cancel</button>

      </div>

    </div>

  `;

  card.setAttribute("data-priority", resident.priority ?? "LOW");
}


// =========================================
// RENDER POS REGISTER
// =========================================

export function renderPOSRegister(container, packerState, recipient = null) {

  if (!recipient) {
    container.innerHTML = `
      <div class="empty-state">
        Select a registered resident first.
      </div>
    `;

    return;
  }

  const items = packerState.getItems();
  const total = packerState.getTotal();

  const packageRemaining = Math.max(
    0,
    packerState.getBudgetCap() - total
  );

  const lifetimeLimit = Number(recipient.ayudaLimit ?? 0);
  const alreadyGiven = Number(recipient.ayudaTotal ?? 0);
  const lifetimeRemaining = Math.max(
    0,
    lifetimeLimit - alreadyGiven
  );

  const priority = recipient.priority ?? "LOW";
  const statusText = recipient.approved
    ? "Approved"
    : "Not Approved";

  const previousItems = Array.isArray(recipient.ayudaItems)
    ? recipient.ayudaItems
    : [];

  const percentUsed = lifetimeLimit > 0
    ? Math.min(100, (alreadyGiven / lifetimeLimit) * 100)
    : 0;

  container.innerHTML = `

    <div class="pos-block">

      <header class="pos-block-head">
        <h4>Beneficiary Summary</h4>
        <div class="pos-tags">
          <span class="pos-priority pos-priority-${priority.toLowerCase()}">
            ${priority}
          </span>
          <span class="pos-status ${recipient.approved ? 'approved' : 'not-approved'}">
            ${statusText}
          </span>
        </div>
      </header>

      <div class="pos-stat-row">
        <div class="pos-stat">
          <span class="pos-stat-label">Maximum Ayuda</span>
          <strong class="pos-stat-value">₱${lifetimeLimit.toFixed(2)}</strong>
        </div>
        <div class="pos-stat">
          <span class="pos-stat-label">Already Given</span>
          <strong class="pos-stat-value">₱${alreadyGiven.toFixed(2)}</strong>
        </div>
        <div class="pos-stat pos-stat-highlight">
          <span class="pos-stat-label">Available</span>
          <strong class="pos-stat-value">₱${lifetimeRemaining.toFixed(2)}</strong>
        </div>
      </div>

<div class="pos-usage">
  <progress
    class="pos-progress"
    value="${alreadyGiven}"
    max="${lifetimeLimit || 1}"
  ></progress>
  <span class="pos-usage-label">${percentUsed.toFixed(0)}% of allocation used</span>
</div>

      ${
        previousItems.length === 0
          ? ""
          : `
            <div class="pos-received">
              <span class="pos-received-label">Received so far</span>
              <ul>
                ${previousItems.map(item => `
                  <li>
                    <span>${sanitizeHTML(String(item.name))}</span>
                    <span>₱${Number(item.price).toFixed(2)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `
      }

    </div>

    <div class="pos-block">

      <header class="pos-block-head">
        <h4>Current Package</h4>
        <span class="pos-block-meta">
          ₱${total.toFixed(2)} / ₱${packerState.getBudgetCap().toFixed(2)}
        </span>
      </header>

      ${
        items.length === 0
          ? `
            <div class="pos-empty">
              No items yet. Add one below.
            </div>
          `
          : `
            <ul class="pos-current-items">
              ${items.map((item, index) => `
                <li>
                  <span class="pos-current-name">
                    ${sanitizeHTML(String(item.name))}
                  </span>
                  <span class="pos-current-price">
                    ₱${Number(item.price).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    class="pos-current-remove"
                    data-action="remove-item"
                    data-index="${index}"
                    title="Remove item"
                  >×</button>
                </li>
              `).join('')}
            </ul>

            <div class="pos-current-foot">
              <span>Remaining budget</span>
              <strong>₱${packageRemaining.toFixed(2)}</strong>
            </div>
          `
      }

    </div>

  `;
}


// =========================================
// EVENT DELEGATION
// =========================================

export function setupActionDelegation(rootElement, actionMap) {

  rootElement.addEventListener('click', e => {

    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    const actionName = actionElement.dataset.action;
    const actionHandler = actionMap[actionName];

    if (typeof actionHandler === 'function') {
      actionHandler(actionElement, e);
    }

  });
}
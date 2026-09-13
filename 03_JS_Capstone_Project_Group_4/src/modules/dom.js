/**
 * [ROLE B] DOM & UI Module - Student Starter Template
 */

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function renderResidentCards(container, residents) {
  if (!container) return;

  if (!residents || residents.length === 0) {
    container.innerHTML = '<p class="empty-state text-gray-500 text-center py-4">No resident applications found.</p>';
    return;
  }

  container.innerHTML = residents.map(resident => {
    const priorityText = (resident.priority || 'NORMAL').toUpperCase();
    
    
    let badgeBg = '#6b7280'; 
    let badgeColor = '#ffffff';

    if (priorityText === 'CRITICAL') badgeBg = '#ef4444';      
    else if (priorityText === 'HIGH') badgeBg = '#f97316';      
    else if (priorityText === 'MEDIUM') badgeBg = '#eab308';    
    else if (priorityText === 'LOW') badgeBg = '#22c55e';       

    const cityName = resident.city ? sanitizeHTML(resident.city) : '';
    const provinceName = resident.province ? sanitizeHTML(resident.province) : '';
    const locationStr = [cityName, provinceName].filter(Boolean).join(', ') || 'N/A';

    return `
      <div class="card resident-card" style="background: #fff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 style="margin: 0; font-size: 1.125rem; font-weight: bold;">${sanitizeHTML(resident.fullName || 'Anonymous')}</h3>
          <span class="badge" style="background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
            ${sanitizeHTML(priorityText)}
          </span>
        </div>
        <div class="card-body" style="font-size: 0.875rem; color: #374151; line-height: 1.5;">
          <p style="margin: 2px 0;"><strong>Score:</strong> ${resident.score ?? 0}</p>
          <p style="margin: 2px 0;"><strong>Status:</strong> ${resident.approved ? 'Approved' : 'Pending/Low Priority'}</p>
          <p style="margin: 2px 0;"><strong>Location:</strong> ${locationStr}</p>
        </div>
        <div class="card-footer" style="margin-top: 1rem;">
          <button class="btn btn-danger" data-action="remove-resident" data-id="${resident.id}" style="width: 100%; background-color: #0f766e; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-weight: 500;">
            Remove
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderPOSRegister(container, packerState) {
  if (!container) return;

  const total = packerState.getTotal();
  const cap = packerState.getBudgetCap();
  const items = packerState.getItems();
  const remaining = cap - total;

  container.innerHTML = `
    <div class="pos-summary">
      <h4>Relief Pack Budget Tracker</h4>
      <p>Subtotal: <strong>₱${total.toFixed(2)}</strong> / ₱${cap.toFixed(2)}</p>
      <p>Remaining: <strong>₱${remaining.toFixed(2)}</strong></p>
      <progress value="${total}" max="${cap}"></progress>
    </div>

    <ul class="pos-item-list">
      ${items.length === 0 
        ? '<li>No items added yet.</li>' 
        : items.map((item, index) => `
            <li>
              <span>${sanitizeHTML(item.name)} - ₱${item.price.toFixed(2)}</span>
              <button class="btn btn-sm btn-outline-danger" data-action="remove-item" data-index="${index}">
                Remove
              </button>
            </li>
          `).join('')
      }
    </ul>
  `;
}

export function setupActionDelegation(rootElement, actionMap) {
  if (!rootElement) return;

  rootElement.addEventListener('click', (e) => {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    if (actionMap && typeof actionMap[action] === 'function') {
      actionMap[action](actionTarget, e);
    }
  });
}
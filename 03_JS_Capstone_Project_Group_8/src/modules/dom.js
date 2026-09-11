/**
 * [ROLE B] DOM & UI Module - Student Starter Template
 */

// Escape HTML to prevent XSS attacks
export function sanitizeHTML(str) {
  if (str == null) return "";
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Render resident cards with REMOVE button
export function renderResidentCards(container, residents) {
  if (residents.length === 0) {
    container.innerHTML = `<p style="color:#666; font-style:italic;">No applications in queue yet.</p>`;
    return;
  }

  container.innerHTML = residents.map(resident => `
    <div class="resident-card" style="border:1px solid #ddd; border-radius:8px; padding:12px; margin:8px 0;">
      <h3>${sanitizeHTML(resident.name)}</h3>
      <p><strong>Province:</strong> ${sanitizeHTML(resident.province || '-')}</p>
      <p><strong>City/Municipality:</strong> ${sanitizeHTML(resident.city || '-')}</p>
      <p><strong>Monthly Income:</strong> ₱${sanitizeHTML(String(resident.monthlyIncome))}</p>
      <p><strong>Senior Citizen:</strong> ${resident.isSenior ? '✅ Yes' : 'No'}</p>
      <p><strong>PWD:</strong> ${resident.isPWD ? '✅ Yes' : 'No'}</p>
      <p><strong>Dependents:</strong> ${sanitizeHTML(String(resident.dependentCount))}</p>
      <hr style="border:none; border-top:1px dashed #ccc; margin:6px 0;">
      <p><strong>Priority:</strong> 
        <span style="font-weight:bold; color:${
          resident.priority === 'CRITICAL' ? '#d32f2f' :
          resident.priority === 'HIGH' ? '#f57c00' : '#2e7d32'
        };">
          ${sanitizeHTML(resident.priority)}
        </span>
      </p>
      <p><strong>Score:</strong> ${sanitizeHTML(String(resident.score))}</p>
      <p><strong>Status:</strong> ${resident.approved ? '✅ Approved for Ayuda' : '❌ Not Eligible'}</p>
      <button 
        type="button" 
        data-action="remove-resident" 
        data-id="${resident.id}"
        style="margin-top:8px; padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">
        Remove from Queue
      </button>
    </div>
  `).join('');
}

// Render POS register with item list, budget bar, and REMOVE buttons
export function renderPOSRegister(container, packerState) {
  const items = packerState.items || [];
  const total = packerState.totalPrice || 0;
  const budgetCap = packerState.getBudgetCap ? packerState.getBudgetCap() : 1000;
  const percentUsed = Math.min((total / budgetCap) * 100, 100);

  container.innerHTML = `
    <p><strong>Total Items:</strong> ${items.length}</p>
    <p><strong>Budget Cap:</strong> ₱${budgetCap.toFixed(2)}</p>
    <p><strong>Total Price:</strong> <span style="font-size:1.1em; font-weight:bold;">₱${total.toFixed(2)}</span></p>
    
    <!-- Budget Progress Bar -->
    <div style="height:12px; background:#eee; border-radius:6px; overflow:hidden; margin:8px 0;">
      <div style="height:100%; width:${percentUsed}%; background:${
        percentUsed >= 90 ? '#ef4444' : percentUsed >= 70 ? '#f59e0b' : '#22c55e'
      }; transition:0.2s;"></div>
    </div>
    <p style="margin:4px 0 10px 0; font-size:0.9em;">${percentUsed.toFixed(1)}% of budget used</p>

    <!-- Item List -->
    ${items.length > 0 ? `
      <ul style="list-style:none; padding:0; margin:10px 0;">
        ${items.map((item, idx) => `
          <li style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid #eee;">
            <span>${sanitizeHTML(item.name)}</span>
            <span>₱${item.price.toFixed(2)}</span>
            <button 
              type="button" 
              data-action="remove-item" 
              data-index="${idx}"
              style="padding:2px 8px; font-size:0.8em; background:#fca5a5; color:#991b1b; border:none; border-radius:4px; cursor:pointer;">
              ✕
            </button>
          </li>
        `).join('')}
      </ul>
    ` : '<p style="color:#888; font-style:italic;">No items added yet.</p>'}
  `;
}

// Delegate click actions from parent container to child elements
export function setupActionDelegation(rootElement, actionMap) {
  rootElement.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (action && actionMap[action]) {
      event.preventDefault();
      actionMap[action](event.target);
    }
  });
}
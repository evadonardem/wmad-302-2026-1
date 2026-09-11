/**
 * [ROLE B] DOM & UI Module - Student Starter Template
 */

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function renderResidentCards(container, residents) {
  container.innerHTML = residents.map(resident => `
    <div class="resident-card">
      <h3>${sanitizeHTML(resident.name)}</h3>
      <p>Age: ${sanitizeHTML(resident.age.toString())}</p>
      <p>Address: ${sanitizeHTML(resident.address)}</p>
    </div>
  `).join('');
    
}

export function renderPOSRegister(container, packerState) {
 
  container.innerHTML = `
    <h2>POS Register</h2>
    <p>Total Items: ${packerState.items.length}</p>
    <p>Total Price: $${packerState.totalPrice.toFixed(2)}</p>
  `;
}

export function setupActionDelegation(rootElement, actionMap) {
  rootElement.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (action && actionMap[action]) {
      actionMap[action](event);
    }
  });
}
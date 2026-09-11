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
  // TODO: Render POS register showing subtotal, budget cap, <progress> bar, and item list with remove buttons.
}

export function setupActionDelegation(rootElement, actionMap) {
  // TODO: Implement event delegation on rootElement for elements with [data-action].
}
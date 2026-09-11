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
}

export function renderPOSRegister(container, packerState) {
  // TODO: Render POS register showing subtotal, budget cap, <progress> bar, and item list with remove buttons.
}

export function setupActionDelegation(rootElement, actionMap) {
  // TODO: Implement event delegation on rootElement for elements with [data-action].
}
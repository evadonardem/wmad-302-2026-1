export function initResidentIdGenerator() {
  const form = document.getElementById('resident-form');
  const nameInput = document.getElementById('res-name');
  const purokSelect = document.getElementById('res-purok');
  const errName = document.getElementById('err-name');
  const errPurok = document.getElementById('err-purok');
  const cardsGrid = document.getElementById('id-cards-grid');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // TODO:
    // 1. Validate name length >= 5
    // 2. Validate purok selection is not empty
    // 3. Render resident card string to cardsGrid if valid
    // 4. Reset form fields upon success
    const name = nameInput.value.trim(), purok = purokSelect.value.trim();
    
    if (errName) errName.textContent = name.length >= 5 ? '' : 'Name must be at least 5 characters.';
    if (errPurok) errPurok.textContent = purok ? '' : 'Please select a Purok.';

    if (name.length >= 5 && purok) {
      cardsGrid?.insertAdjacentHTML('beforeend', `<div class="resident-card"><h3>${name}</h3><p>Purok: ${purok}</p></div>`);
      form.reset();
    }
  });
}
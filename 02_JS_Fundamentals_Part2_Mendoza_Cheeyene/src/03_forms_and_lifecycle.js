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

    // Clear old errors first
    errName.textContent = '';
    errPurok.textContent = '';
    let isValid = true;

    // 1. Validate name length >= 5
    const nameValue = nameInput.value.trim();
    if (nameValue.length < 5) {
      errName.textContent = 'Name must be at least 5 characters long.';
      isValid = false;
    }

    // 2. Validate purok selection is not empty
    const purokValue = purokSelect.value.trim();
    if (!purokValue) {
      errPurok.textContent = 'Please select a Purok.';
      isValid = false;
    }

    // Stop here if there are errors
    if (!isValid) return;

    // 3. Render resident card
    const cardHTML = `
      <div class="id-card">
        <h4>${nameValue}</h4>
        <p>Purok: ${purokValue}</p>
      </div>
    `;
    cardsGrid.insertAdjacentHTML('beforeend', cardHTML);

    // 4. Reset form fields
    form.reset();
  });
}
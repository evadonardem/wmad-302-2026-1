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
    
    if (nameInput.value.length < 5) {
      errName.textContent = 'Name must be at least 5 characters long.';
      return;
    } else {
      errName.textContent = '';
    }

    if (purokSelect.value === '') {
      errPurok.textContent = 'Please select a purok.';
      return;
    } else {
      errPurok.textContent = '';
    }

    const residentCard = `
      <div class="resident-card">
        <h3>${nameInput.value}</h3>
        <p>Purok: ${purokSelect.value}</p>
      </div>
    `;

    cardsGrid.insertAdjacentHTML('beforeend', residentCard);

    form.reset();
  });
}
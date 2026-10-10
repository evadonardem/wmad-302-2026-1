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

    const name = nameInput.value.trim();
    const purok = purokSelect.value;

    let isValid = true;

    if (name.length < 5) {
      errName.textContent = 'Name must be at least 5 characters.';
      isValid = false;
    } else {
      errName.textContent = '';
    }

    if (!purok) {
      errPurok.textContent = 'Please select a purok.';
      isValid = false;
    } else {
      errPurok.textContent = '';
    }

    if (!isValid) return;

    cardsGrid.insertAdjacentHTML('beforeend', `
      <div class="resident-card">
        <h3>🏛️ Barangay Resident Card</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Zone:</strong> ${purok}</p>
      </div>
    `);

    form.reset();
  });
}
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

    const nameValue = nameInput.value.trim();
    const purokValue = purokSelect.value;
    let isValid = true;

    errName.textContent = '';
    errPurok.textContent = '';

    if (nameValue.length < 5) {
      errName.textContent = 'Name must be at least 5 characters long.';
      isValid = false;
    }

    if (!purokValue) {
      errPurok.textContent = 'Please select a valid Purok / Zone.';
      isValid = false;
    }
    if (!isValid) return;

    const cardHTML = `
      <div class="resident-card">
          <h3>🏛️ Barangay Resident Card</h3>
          <p><strong>Name:</strong> ${nameValue}</p>
          <p><strong>Zone:</strong> ${purokValue}</p>
      </div>
    `;
    cardsGrid.insertAdjacentHTML('beforeend', cardHTML);

    form.reset();
  });
}
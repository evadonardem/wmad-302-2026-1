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

    errName.textContent = '';
    errPurok.textContent = '';

    const name = nameInput.value.trim();
    const purok = purokSelect.value;

    let isValid = true;

    if (name.length < 5) {
      errName.textContent = 'Error. Name must be at least 5 characters.';
      isValid = false;
    }

    if (!purok) {
      errPurok.textContent = 'Error. Please select a Purok.';
      isValid = false;
    }

    if (!isValid) return;

    const card = document.createElement('div');
    card.className = 'resident-card';

    card.innerHTML = `
      <h3>🏛️ Barangay Resident Card</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Zone:</strong> ${purok}</p>
    `;

    cardsGrid.appendChild(card);

    form.reset();
  });
}
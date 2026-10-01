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

    let isValid = true;
    const nameVal = nameInput ? nameInput.value.trim() : '';
    const purokVal = purokSelect ? purokSelect.value : '';

    if (errName) errName.textContent = '';
    if (errPurok) errPurok.textContent = '';

    if (nameVal.length < 5) {
      if (errName) errName.textContent = 'Name must be at least 5 characters long.';
      isValid = false;
    }

    if (!purokVal) {
      if (errPurok) errPurok.textContent = 'Please select a Purok/Zone.';
      isValid = false;
    }

    if (!isValid) return;

    if (cardsGrid) {
      const card = document.createElement('div');
      card.className = 'resident-card';
      card.innerHTML = `
        <h3>🏛️ Barangay Resident Card</h3>
        <p><strong>Name:</strong> ${nameVal}</p>
        <p><strong>Zone:</strong> ${purokVal}</p>
      `;
      cardsGrid.appendChild(card);
    }

    form.reset();
  });
}
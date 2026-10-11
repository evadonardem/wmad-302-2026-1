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
    const nameVal = nameInput.value.trim();
    if (nameVal.length < 5) {
      errName.textContent = 'Name must be at least 5 characters.';
      isValid = false;
    }

    // 2. Validate purok selection is not empty
     const purokVal = purokSelect.value;
    if (!purokVal) {
      errPurok.textContent = 'Please select a zone/purok.';
      isValid = false;
    }

    // 3. Render resident card string to cardsGrid if valid
    if (isValid) {
      const card = document.createElement('div');
      card.className = 'resident-card';
      card.innerHTML = `
        <h3>🏘 Barangay Resident Card</h3>
        <p><strong>Name:</strong> ${nameVal}</p>
        <p><strong>Zone:</strong> ${purokVal}</p>
      `;
      cardsGrid.appendChild(card);
    // 4. Reset form fields upon success
      form.reset();
    }
  });
}
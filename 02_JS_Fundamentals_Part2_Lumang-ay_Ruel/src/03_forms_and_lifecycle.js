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

    // Validate name
    if (name.length < 5) {
      errName.textContent = 'Name must be at least 5 characters';
      isValid = false;
    } else {
      errName.textContent = '';
    }

    // Validate purok
    if (!purok) {
      errPurok.textContent = 'Please select a zone';
      isValid = false;
    } else {
      errPurok.textContent = '';
    }

    // Render card if valid
    if (isValid) {
      const card = document.createElement('div');
      card.className = 'resident-card';
      card.innerHTML = `
        <h3>🏛️ Barangay Resident Card</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Zone:</strong> ${purok}</p>
      `;
      cardsGrid.appendChild(card);

      // Reset form
      nameInput.value = '';
      purokSelect.value = '';
    }
  });
}
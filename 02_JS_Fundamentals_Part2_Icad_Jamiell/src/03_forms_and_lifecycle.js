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
    const fullName = nameInput.value.trim();
    const purok = purokSelect.value;

    let isValid = true;

    // Validate name
    if (fullName.length < 5) {
      errName.textContent = 'Name must be at least 5 characters.';
      isValid = false;
    } else {
      errName.textContent = '';
    }

    // Validate purok
    if (!purok) {
      errPurok.textContent = 'Please select a Purok.';
      isValid = false;
    } else {
      errPurok.textContent = '';
    }

    // Stop if validation fails
    if (!isValid) return;

    // Create resident card
    const card = document.createElement('div');
    card.className = 'resident-card';

    card.innerHTML = `
      <h3>🏛️ Barangay Resident Card</h3>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Zone:</strong> ${purok}</p>
    `;

    cardsGrid.appendChild(card);

    // Reset form
    form.reset();
  });
}
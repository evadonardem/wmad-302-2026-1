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
    const trimmedName = nameInput.value.trim();
    const selectedPurok = purokSelect.value;

    if (errName) errName.textContent = '';
    if (errPurok) errPurok.textContent = '';

    if (trimmedName.length < 5) {
      if (errName) errName.textContent = 'Name must be at least 5 characters.';
      isValid = false;
    }

    if (!selectedPurok) {
      if (errPurok) errPurok.textContent = 'Please select a Purok.';
      isValid = false;
    }

    if (isValid) {
      const cardHTML = `
        <div class="resident-card">
            <h3>🏛️ Barangay Resident Card</h3>
            <p><strong>Name:</strong> ${trimmedName}</p>
            <p><strong>Zone:</strong> ${selectedPurok}</p>
        </div>
      `;

      if (cardsGrid) {
        cardsGrid.insertAdjacentHTML('beforeend', cardHTML);
      }

      form.reset();
    }
  });
}
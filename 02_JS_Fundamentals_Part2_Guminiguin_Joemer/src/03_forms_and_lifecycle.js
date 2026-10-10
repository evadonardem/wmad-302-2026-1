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

    let isValid = true;
    const nameValue = nameInput ? nameInput.value.trim() : '';
    const purokValue = purokSelect ? purokSelect.value : '';

    // Clear previous errors
    if (errName) errName.textContent = '';
    if (errPurok) errPurok.textContent = '';

    // Validate Name (>= 5 chars trimmed)
    if (nameValue.length < 5) {
      if (errName) errName.textContent = 'Name must be at least 5 characters.';
      isValid = false;
    }

    // Validate Purok selection
    if (!purokValue) {
      if (errPurok) errPurok.textContent = 'Please select a purok.';
      isValid = false;
    }

    // If valid, append resident card and reset form
    if (isValid) {
      const cardHTML = `
        <div class="resident-card">
            <h3>🏛️ Barangay Resident Card</h3>
            <p><strong>Name:</strong> ${nameValue}</p>
            <p><strong>Zone:</strong> ${purokValue}</p>
        </div>
      `;

      if (cardsGrid) {
        cardsGrid.insertAdjacentHTML('beforeend', cardHTML);
      }

      form.reset();
    }
  });
}
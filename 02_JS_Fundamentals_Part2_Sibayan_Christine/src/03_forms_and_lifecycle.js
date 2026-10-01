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


    if (errName) errName.textContent = '';
    if (errPurok) errPurok.textContent = '';

    const nameVal = nameInput ? nameInput.value.trim() : '';
    const purokVal = purokSelect ? purokSelect.value : '';
    let isValid = true;

    if (!(nameVal.length >= 5)) {
      if (errName) errName.textContent = 'Name must be at least 5 characters.';
      isValid = false;
    }

    if (!purokVal) {
      if (errPurok) errPurok.textContent = 'Please select a Purok.';
      isValid = false;
    }

    if (!isValid) return;

    const cardHtml = `
      <div class="resident-card">
        <h3>🏛️ Barangay Resident Card</h3>
        <p><strong>Name:</strong> ${nameVal}</p>
        <p><strong>Zone:</strong> ${purokVal}</p>
      </div>
    `;

    if (cardsGrid) {
      cardsGrid.insertAdjacentHTML('beforeend', cardHtml);
    }

    form.reset();
    
  });
}
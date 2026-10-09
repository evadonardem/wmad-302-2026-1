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

   const name = nameInput.value;
    const purok = purokSelect.value;

    errName.textContent = '';
    errPurok.textContent = '';

    if (name.length < 5) {
      errName.textContent = 'Name must be at least 5 characters.';
      return;
    }

    if (purok === '') {
      errPurok.textContent = 'Please select a purok.';
      return;
    }

    cardsGrid.innerHTML +=
      '<div class="id-card">' +
      '<h3>Resident ID</h3>' +
      '<p>Name: ' + name + '</p>' +
      '<p>Purok: ' + purok + '</p>' +
      '</div>';

    form.reset();
  });
}
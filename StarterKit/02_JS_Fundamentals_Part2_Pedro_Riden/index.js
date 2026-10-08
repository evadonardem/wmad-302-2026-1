const btnSync = document.querySelector('#btn-sync-routes');
const statActive = document.querySelector('#stat-active');
const statDelayed = document.querySelector('#stat-delayed');
const routeListItems = document.querySelectorAll('#route-list li');

if (btnSync) {
  btnSync.addEventListener('click', () => {
    let activeCount = 0;
    let delayedCount = 0;

    routeListItems.forEach(item => {
      if (item.dataset.status === 'active') {
        activeCount++;
      } else if (item.dataset.status === 'delayed') {
        delayedCount++;
      }
    });

    statActive.textContent = `Active Routes: ${activeCount}`;
    statDelayed.textContent = `Delayed/Full: ${delayedCount}`;
  });
}

const posRegister = document.querySelector('#pos-register');
const billTotalEl = document.querySelector('#bill-total');
let runningTotal = 0;

if (posRegister) {
  posRegister.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    
    if (!button) return;

    const action = button.dataset.action;

    if (action === 'add') {
      const amount = Number(button.dataset.amount);
      runningTotal += amount;
    } else if (action === 'clear') {
      runningTotal = 0;
    }
    billTotalEl.textContent = `₱${runningTotal.toFixed(2)}`;
  });
}

const residentForm = document.querySelector('#resident-form');
const resNameInput = document.querySelector('#res-name');
const resPurokSelect = document.querySelector('#res-purok');
const errName = document.querySelector('#err-name');
const errPurok = document.querySelector('#err-purok');
const idCardsGrid = document.querySelector('#id-cards-grid');

if (residentForm) {
  residentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameValue = resNameInput.value.trim();
    const purokValue = resPurokSelect.value;
    let isValid = true;

    if (nameValue.length < 5) {
      errName.textContent = 'Name must be at least 5 characters long.';
      isValid = false;
    } else {
      errName.textContent = '';
    }

    if (!purokValue) {
      errPurok.textContent = 'Please select a Purok/Zone.';
      isValid = false;
    } else {
      errPurok.textContent = '';
    }

    if (isValid) {
      const cardHTML = `
        <div class="resident-card">
            <h3>🏛️ Barangay Resident Card</h3>
            <p><strong>Name:</strong> ${nameValue}</p>
            <p><strong>Zone:</strong> ${purokValue}</p>
        </div>
      `;
      
      idCardsGrid.insertAdjacentHTML('beforeend', cardHTML);

      residentForm.reset();
    }
  });
}
/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */

import {
  evaluateAyudaEligibility,
  createReliefPacker
} from './modules/engine.js';

import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  getOfflineQueue,
  saveToOfflineQueue,
  removeFromOfflineQueue
} from './modules/async.js';

import {
  renderResidentCards,
  renderQueueSummary,
  renderPOSRegister,
  setupActionDelegation
} from './modules/dom.js';


const form = document.getElementById('ayuda-form');

const provinceSelect = document.getElementById('prov-select');
const citySelect = document.getElementById('city-select');

const queueContainer =
  document.getElementById('queue-container');

const queueSummary =
  document.getElementById('queue-summary');

const summaryButton =
  document.getElementById('summary-btn');

const queueButton =
  document.getElementById('queue-btn');

const posContainer =
  document.getElementById('pos-container');

const addItemButton =
  document.getElementById('add-item-btn');

const itemName =
  document.getElementById('item-name');

const itemPrice =
  document.getElementById('item-price');


/* Create Relief Packer */
const reliefPacker = createReliefPacker(1000);


/* Load saved residents */
let residents = getOfflineQueue();


/* =========================
   RENDER FUNCTIONS
========================= */

function renderQueue() {
  renderResidentCards(
    queueContainer,
    residents
  );
}


function renderSummary() {
  renderQueueSummary(
    queueSummary,
    residents
  );
}


function renderPOS() {
  renderPOSRegister(
    posContainer,
    reliefPacker
  );
}


/* =========================
   LOAD PROVINCES
========================= */

fetchProvinces().then((provinces) => {

  provinces.forEach((province) => {

    const option =
      document.createElement('option');

    option.value = province.code;
    option.textContent = province.name;

    provinceSelect.appendChild(option);
  });

});


/* =========================
   PROVINCE → CITY
========================= */

provinceSelect.addEventListener(
  'change',
  async () => {

    const provinceCode =
      provinceSelect.value;

    citySelect.innerHTML =
      '<option value="">Select City/Municipality...</option>';

    if (!provinceCode) {
      return;
    }

    const cities =
      await fetchCitiesMunicipalities(
        provinceCode
      );

    cities.forEach((city) => {

      const option =
        document.createElement('option');

      option.value = city.code;
      option.textContent = city.name;

      citySelect.appendChild(option);
    });

  }
);


/* =========================
   REGISTER RESIDENT
========================= */

form.addEventListener('submit',
  (e) => {

    e.preventDefault()

    const citizen = {

      id: Date.now(),

      name:
        document.getElementById('name').value,

      province:
        provinceSelect.options[provinceSelect.selectedIndex]?.textContent || '',

      city:
        citySelect.options[citySelect.selectedIndex]?.textContent || '',
  

      monthlyIncome:
        Number(document.getElementById('monthly-income').value),

      isSenior: 
      document.getElementById('is-senior').checked,

      isPWD:
      document.getElementById('is-pwd').checked,

      dependentCount:
        Number(document.getElementById('dependent-count' ).value)
    };


    /* Calculate eligibility */
    const result = evaluateAyudaEligibility(citizen);


    /* Create resident object */
    const resident = {...citizen,

      priority:
        result.priority,

      score:
        result.score,

      approved:
        result.approved
    };


    /* Add to memory */
    residents.push(resident);


    /* Save to LocalStorage */
    saveToOfflineQueue(resident);


    /* Update both sections */
    renderQueue();
    renderSummary();


    /* Reset form */
    form.reset();

    citySelect.innerHTML =
      '<option value="">Select City/Municipality...</option>';

  }
);


/* =========================
   SUMMARY BUTTON
========================= */

summaryButton.addEventListener(
  'click',
  () => {

    queueSummary.classList.toggle('show');

    if (queueSummary.classList.contains('show')) {

      renderSummary();

      summaryButton.textContent =
        'Hide Summary';

    } else {

      summaryButton.textContent =
        'View Summary';
    }

  }
);


/* =========================
   REGISTERED QUEUE BUTTON
========================= */

queueButton.addEventListener(
  'click',
  () => {

    queueContainer.classList.toggle(
      'queue-hidden'
    );

    if (
      queueContainer.classList.contains(
        'queue-hidden'
      )
    ) {

      queueButton.textContent =
        'View Registered Queue';

    } else {

      queueButton.textContent =
        'Hide Registered Queue';
    }

  }
);


/* =========================
   ADD RELIEF ITEM
========================= */

addItemButton.addEventListener(
  'click',
  () => {

    const name =
      itemName.value;

    const price =
      Number(itemPrice.value);


    const result =
      reliefPacker.addItem(
        name,
        price
      );


    if (!result.success) {

      alert(result.reason);
      return;
    }


    itemName.value = '';
    itemPrice.value = '';


    renderPOS();

  }
);


/* =========================
   REMOVE RESIDENT
========================= */

setupActionDelegation(
  queueContainer,
  {

    'remove-resident': (id) => {

      const residentId =
        Number(id);


      residents =
        residents.filter(
          (resident) =>
            resident.id !== residentId
        );


      removeFromOfflineQueue(
        residentId
      );


      /* Update both sections */
      renderQueue();
      renderSummary();

    }

  }
);


/* =========================
   REMOVE RELIEF ITEM
========================= */

setupActionDelegation(
  posContainer,
  {

    'remove-item': (id) => {

      reliefPacker.removeItem(
        Number(id)
      );

      renderPOS();

    }

  }
);


/* =========================
   INITIAL RENDER
========================= */

renderQueue();
renderSummary();
renderPOS();


document.addEventListener(
  'DOMContentLoaded',
  () => {

    console.log(
      "e-Barangay Starter Kit Initialized. Happy Coding!"
    );

  }
);
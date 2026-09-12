/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */

// TODO: Import required functions from engine.js, dom.js, and async.js
// TODO: Initialize DOM elements, load initial LocalStorage queue, fetch provinces, setup event listeners for form submission, cascading province/city dropdowns, POS packer, and action delegation.

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
  renderPOSRegister,
  setupActionDelegation
} from './modules/dom.js';

const form = document.getElementById('ayuda-form');
const provinceSelect = document.getElementById('prov-select');
const citySelect = document.getElementById('city-select');
const queueContainer = document.getElementById('queue-container');
const posContainer = document.getElementById('pos-container');
const addItemButton = document.getElementById('add-item-btn');
const itemName = document.getElementById('item-name');
const itemPrice = document.getElementById('item-price');

const reliefPacker = createReliefPacker(1000);

let residents = getOfflineQueue();

function renderQueue() {
  renderResidentCards(queueContainer, residents);
}

function renderPOS() {
  renderPOSRegister(posContainer, reliefPacker);
}

fetchProvinces().then((provinces) => {
  provinces.forEach((province) => {
    const option = document.createElement('option');

    option.value = province.code;
    option.textContent = province.name;

    provinceSelect.appendChild(option);
  });
});

provinceSelect.addEventListener('change', async () => {
  const provinceCode = provinceSelect.value;

  citySelect.innerHTML =
    '<option value="">Select City/Municipality...</option>';

  if (!provinceCode) {
    return;
  }

  const cities = await fetchCitiesMunicipalities(provinceCode);

  cities.forEach((city) => {
    const option = document.createElement('option');

    option.value = city.code;
    option.textContent = city.name;

    citySelect.appendChild(option);
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const citizen = {
    id: Date.now(),
    name: document.getElementById('name').value,
    province: provinceSelect.value,
    city: citySelect.value,
    monthlyIncome: Number(
      document.getElementById('monthly-income').value
    ),
    isSenior: document.getElementById('is-senior').checked,
    isPWD: document.getElementById('is-pwd').checked,
    dependentCount: Number(
      document.getElementById('dependent-count').value
    )
  };

  const result = evaluateAyudaEligibility(citizen);

  const resident = {
    ...citizen,
    priority: result.priority,
    score: result.score,
    approved: result.approved
  };

  residents.push(resident);
  saveToOfflineQueue(resident);

  renderQueue();

  form.reset();
  citySelect.innerHTML =
    '<option value="">Select City/Municipality...</option>';
});

addItemButton.addEventListener('click', () => {
  const name = itemName.value;
  const price = Number(itemPrice.value);

  const result = reliefPacker.addItem(name, price);

  if (!result.success) {
    alert(result.reason);
    return;
  }

  itemName.value = '';
  itemPrice.value = '';

  renderPOS();
});

setupActionDelegation(queueContainer, {
  'remove-resident': (id) => {
    const residentId = Number(id);

    residents = residents.filter(
      (resident) => resident.id !== residentId
    );

    removeFromOfflineQueue(residentId);

    renderQueue();
  }
});

setupActionDelegation(posContainer, {
  'remove-item': (id) => {
    reliefPacker.removeItem(Number(id));
    renderPOS();
  }
});

renderQueue();
renderPOS();
document.addEventListener('DOMContentLoaded', () => {
  console.log("e-Barangay Starter Kit Initialized. Happy Coding!");
});
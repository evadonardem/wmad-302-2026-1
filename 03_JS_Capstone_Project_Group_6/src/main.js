/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */



// TODO: Import required functions from engine.js, dom.js, and async.js
// TODO: Initialize DOM elements, load initial LocalStorage queue, fetch provinces, setup event listeners for form submission, cascading province/city dropdowns, POS packer, and action delegation.

import{evaluateAyudaEligibility, createReliefPacker} from './modules/engine.js';
import{sanitizeHTML, renderResidentCards, renderPOSRegister, setupActionDelegation} from './modules/dom.js';
import{fetchProvinces, fetchCitiesMunicipalities, getOfflineQueue, saveToOfflineQueue, removeFromOfflineQueue} from './modules/async.js';


let packer = createReliefPacker(1000);
function renderPOS() {
  const posContainer = document.getElementById('pos-container');
  const item = document.getElementById('item-name').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  packer.addItem(item, price);

  const packerState = {
    items: packer.getItems(),
    total: packer.getTotal(),
    budgetCap: packer.getBudgetCap()
  };
  renderPOSRegister(posContainer, packerState);
}

document.getElementById('add-item-btn').addEventListener('click', (e) => {
  e.preventDefault();
  
  renderPOS();
  document.getElementById('item-name').value = '';
  document.getElementById('item-price').value = '';
  
});


//From Modules
function renderQueue() {
  const container = document.getElementById('queue-container');
  const residents = getOfflineQueue();
  const sorted = [...residents].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  renderResidentCards(container, sorted);
}

//From Async
async function provinces(){
  const provinces = await fetchProvinces();
  const provSelect = document.getElementById("prov-select");

  provinces.sort((a, b) => a.name.localeCompare(b.name));
  provSelect.innerHTML = `
    <option value="">Select Province...</option>
  `;

  provinces.forEach(province => {

    const option = document.createElement('option');
    option.value = province.code;
    option.textContent = province.name;

    provSelect.appendChild(option);
  });
}


async function CitiesMunicipalities(provinceCode) {
  const citiesMunicipalities = await fetchCitiesMunicipalities(provinceCode);
  const citySelect = document.getElementById("city-select");

  citiesMunicipalities.sort((a, b) => a.name.localeCompare(b.name));
  citySelect.innerHTML = `
        <option value="">Select City/Municipality...</option>
  `;

  citiesMunicipalities.forEach(city => {

    const option = document.createElement('option');
    option.value = city.code;
    option.textContent = city.name;

    citySelect.appendChild(option);
  });
}

async function loadOfflineQueue() {
  const offlineQueue = getOfflineQueue();
  const residentContainer = document.getElementById('resident-container');
  renderResidentCards(residentContainer, offlineQueue);
}

async function saveResidentToQueue(resident) {
  saveToOfflineQueue(resident);
  loadOfflineQueue();
}

async function removeResidentFromQueue(residentId) {
  removeFromOfflineQueue(residentId);
  loadOfflineQueue();
}


document.getElementById("prov-select").addEventListener('change', (e) => {
  CitiesMunicipalities(e.target.value);
});

document.getElementById("ayuda-form").addEventListener('submit', (e) => {
  e.preventDefault();

  const name = sanitizeHTML(document.getElementById('name').value.trim());
  const provinceSelect = document.getElementById('prov-select');
  const citySelect = document.getElementById('city-select');
  const provinceName = provinceSelect.options[provinceSelect.selectedIndex].text;
  const cityName = citySelect.options[citySelect.selectedIndex].text;
  const monthlyIncome = parseFloat(document.getElementById('monthly-income').value);
  const dependentCount = parseInt(document.getElementById('dependent-count').value);
  const ifSeniorCitizen = document.getElementById('is-senior').checked;
  const ifPWD = document.getElementById('is-pwd').checked;


  const citizenData = {
    name,
    provinceName,
    cityName,
    monthlyIncome,
    dependentCount,
    ifSeniorCitizen,
    ifPWD
  };

  const evaluationResult = evaluateAyudaEligibility(citizenData);
  const resident = {
    ...citizenData,
    ...evaluationResult,
    id: Date.now()
  };

  
  document.getElementById('ayuda-form').reset();


  
  console.log(resident.score);

  try {
    saveToOfflineQueue(resident);
    document.getElementById('ayuda-form').reset();
    renderQueue();
  } catch (err) {
    alert('Failed to save application. Please try again or contact barangay staff.');
  }
});

setupActionDelegation(document.getElementById('queue-container'), {
  'remove-resident': (trigger) => {
    const id = Number(trigger.dataset.id); 
    removeFromOfflineQueue(id);
    renderQueue();
  }
});

setupActionDelegation(document.getElementById('pos-container'), {
  'remove-item': (trigger) => {
    const index = Number(trigger.dataset.index);
    packer.removeItem(index);
    renderPOS();
  }
});


document.getElementById('search-queue').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const residents = getOfflineQueue();
  const filtered = residents.filter(resident => resident.name.toLowerCase().includes(searchTerm));
  renderResidentCards(document.getElementById('queue-container'), filtered);
});

document.getElementById('critical').addEventListener('click', () => {
  const residents = getOfflineQueue();
  const filtered = residents.filter(resident => resident.priority === 'CRITICAL');
  renderResidentCards(document.getElementById('queue-container'), filtered);
});

document.getElementById('high').addEventListener('click', () => {
  const residents = getOfflineQueue();
  const filtered = residents.filter(resident => resident.priority === 'HIGH');
  renderResidentCards(document.getElementById('queue-container'), filtered);
});

document.getElementById('low').addEventListener('click', () => {
  const residents = getOfflineQueue();
  const filtered = residents.filter (resident => resident.priority === 'LOW');
  renderResidentCards(document.getElementById('queue-container'), filtered);
});

document.getElementById('reset-filter').addEventListener('click', () => {
  renderQueue();
});


document.addEventListener('DOMContentLoaded', () => {
console.log("e-Barangay Starter Kit Initialized. Happy Coding!");

provinces();
loadOfflineQueue();
renderQueue();
renderPOS();
});

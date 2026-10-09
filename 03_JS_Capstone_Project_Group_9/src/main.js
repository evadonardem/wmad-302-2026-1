/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */

import { evaluateAyudaEligibility, createReliefPacker } from './modules/engine.js';
import {
  renderResidentCards,
  renderPOSRegister,
  renderDashboardStats,
  showToast,
  setupActionDelegation
} from './modules/dom.js';
import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  getOfflineQueue,
  saveToOfflineQueue,
  removeFromOfflineQueue,
  isOnline
} from './modules/async.js';

// Global state
const packer = createReliefPacker(1000);
let residents = [];
let queueSearchTerm = '';

// DOM elements
const form = document.getElementById('ayuda-form');
const provSelect = document.getElementById('prov-select');
const citySelect = document.getElementById('city-select');
const queueContainer = document.getElementById('queue-container');
const queueSearch = document.getElementById('queue-search');
const posContainer = document.getElementById('pos-container');
const addItemBtn = document.getElementById('add-item-btn');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const offlineBanner = document.getElementById('offline-banner');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// --- Tabs ---
function activateTab(tabName) {
  tabButtons.forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  tabPanels.forEach(panel => {
    panel.hidden = panel.dataset.tabPanel !== tabName;
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// --- Offline banner ---
function refreshOfflineBanner() {
  offlineBanner.hidden = isOnline();
}
window.addEventListener('online', refreshOfflineBanner);
window.addEventListener('offline', refreshOfflineBanner);

// Render helpers
function getFilteredResidents() {
  if (!queueSearchTerm) return residents;
  const term = queueSearchTerm.toLowerCase();
  return residents.filter(r =>
    r.name.toLowerCase().includes(term) || r.priority.toLowerCase().includes(term)
  );
}

function refreshQueue() {
  renderResidentCards(queueContainer, getFilteredResidents());
  renderDashboardStats(residents, packer);
}

function refreshPOS() {
  renderPOSRegister(posContainer, packer);
  renderDashboardStats(residents, packer);
}

queueSearch.addEventListener('input', () => {
  queueSearchTerm = queueSearch.value.trim();
  refreshQueue();
});

// Load provinces on start
async function loadProvinces() {
  const provinces = await fetchProvinces();
  provSelect.innerHTML = '<option value="">Select Province...</option>' +
    provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
}

// Load cities when province changes
provSelect.addEventListener('change', async () => {
  const provinceCode = provSelect.value;
  citySelect.innerHTML = '<option value="">Loading...</option>';

  if (!provinceCode) {
    citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
    return;
  }

  const cities = await fetchCitiesMunicipalities(provinceCode);
  citySelect.innerHTML = '<option value="">Select City/Municipality...</option>' +
    cities.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
});

// Form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const citizen = {
    name: document.getElementById('name').value,
    monthlyIncome: Number(document.getElementById('monthly-income').value),
    isSenior: document.getElementById('is-senior').checked,
    isPWD: document.getElementById('is-pwd').checked,
    dependentCount: Number(document.getElementById('dependent-count').value)
  };

  const result = evaluateAyudaEligibility(citizen);

  const resident = {
    id: Date.now().toString(),
    name: citizen.name,
    priority: result.priority,
    score: result.score,
    approved: result.approved
  };

  residents.push(resident);
  saveToOfflineQueue(resident);
  refreshQueue();

  showToast(`${citizen.name} registered — ${result.priority} priority.`, 'success');

  form.reset();
  citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
  activateTab('queue');
});

// Add item to relief packer
addItemBtn.addEventListener('click', () => {
  const name = itemNameInput.value.trim();
  const price = Number(itemPriceInput.value);

  if (!name || !price || price <= 0) {
    showToast('Please enter a valid item name and price.', 'error');
    return;
  }

  const success = packer.addItem(name, price);
  if (!success) {
    showToast('Adding this item exceeds the budget cap!', 'error');
    return;
  }

  refreshPOS();
  itemNameInput.value = '';
  itemPriceInput.value = '';
});
// Event delegation for remove actions
setupActionDelegation(queueContainer, {
  'remove-resident': (id) => {
    const resident = residents.find(r => r.id === id);
    const confirmed = window.confirm(`Remove ${resident ? resident.name : 'this resident'} from the queue?`);
    if (!confirmed) return;

    residents = residents.filter(r => r.id !== id);
    removeFromOfflineQueue(id);
    refreshQueue();
    showToast('Resident removed from the queue.', 'info');
  }
});

setupActionDelegation(posContainer, {
  'remove-item': (index) => {
    packer.removeItem(Number(index));
    refreshPOS();
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log("e-Barangay Starter Kit Initialized. Happy Coding!");

  residents = getOfflineQueue();

  refreshOfflineBanner();
  loadProvinces();
  refreshQueue();
  refreshPOS();
});
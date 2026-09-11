/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */
import {
  evaluateAyudaEligibility,
  createReliefPacker
} from './modules/engine.js';
import {
  renderResidentCards,
  renderPOSRegister,
  setupActionDelegation
} from './modules/dom.js';
import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  getOfflineQueue,
  saveToOfflineQueue,
  removeFromOfflineQueue
} from './modules/async.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("e-Barangay Starter Kit Initialized. Happy Coding!");

  const ayudaForm = document.getElementById('ayuda-form');
  const nameInput = document.getElementById('name');
  const provinceSelect = document.getElementById('prov-select');
  const citySelect = document.getElementById('city-select');
  const incomeInput = document.getElementById('monthly-income');
  const seniorInput = document.getElementById('is-senior');
  const pwdInput = document.getElementById('is-pwd');
  const dependentInput = document.getElementById('dependent-count');
  const queueContainer = document.getElementById('queue-container');
  const posContainer = document.getElementById('pos-container');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');
  const addItemButton = document.getElementById('add-item-btn');

  let residents = getOfflineQueue();
  const reliefPacker = createReliefPacker(1000);

  function renderQueue() {
    renderResidentCards(queueContainer, residents);
  }
  function renderPOS() {
    renderPOSRegister(posContainer, reliefPacker);
  }

  // Load Provinces
  const provinces = await fetchProvinces();
  provinces.forEach((province) => {
    const option = document.createElement('option');
    option.value = province.code;
    option.textContent = province.name;
    provinceSelect.appendChild(option);
  });

  // Load Cities/Municipalities on Province Change
  provinceSelect.addEventListener('change', async () => {
    const provinceCode = provinceSelect.value;
    citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
    if (!provinceCode) return;
    const cities = await fetchCitiesMunicipalities(provinceCode);
    cities.forEach((city) => {
      const option = document.createElement('option');
      option.value = city.code;
      option.textContent = city.name;
      citySelect.appendChild(option);
    });
  });

  // Submit Resident Form
  ayudaForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const citizen = {
      isSenior: seniorInput.checked,
      isPWD: pwdInput.checked,
      monthlyIncome: Number(incomeInput.value),
      dependentCount: Number(dependentInput.value)
    };
    const result = evaluateAyudaEligibility(citizen);
    const resident = {
      id: Date.now(),
      name: nameInput.value,
      province: provinceSelect.options[provinceSelect.selectedIndex]?.text || "",
      city: citySelect.options[citySelect.selectedIndex]?.text || "",
      monthlyIncome: citizen.monthlyIncome,
      isSenior: citizen.isSenior,
      isPWD: citizen.isPWD,
      dependentCount: citizen.dependentCount,
      priority: result.priority,
      score: result.score,
      approved: result.approved
    };
    residents.push(resident);
    saveToOfflineQueue(resident);
    renderQueue();
    ayudaForm.reset();
    citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
  });

  // Add Relief Item
  addItemButton.addEventListener('click', () => {
    const itemName = itemNameInput.value.trim();
    const itemPrice = Number(itemPriceInput.value);
    if (itemName === '' || itemPrice <= 0) {
      alert('Please enter a valid item name and price.');
      return;
    }
    const result = reliefPacker.addItem(itemName, itemPrice);
    if (!result.success) {
      alert(result.reason);
      return;
    }
    itemNameInput.value = '';
    itemPriceInput.value = '';
    renderPOS();
  });

  // Remove Resident from Queue
  setupActionDelegation(queueContainer, {
    'remove-resident': (element) => {
      const id = Number(element.dataset.id);
      residents = residents.filter((r) => r.id !== id);
      removeFromOfflineQueue(id);
      renderQueue();
    }
  });

  // Remove Relief Item
  setupActionDelegation(posContainer, {
    'remove-item': (element) => {
      const index = Number(element.dataset.index);
      reliefPacker.removeItem(index);
      renderPOS();
    }
  });

  renderQueue();
  renderPOS();
});
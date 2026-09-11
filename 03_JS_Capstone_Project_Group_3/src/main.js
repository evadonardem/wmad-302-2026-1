/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */

import { evaluateAyudaEligibility, createReliefPacker } from './modules/engine.js';
import { renderResidentCards, renderPOSRegister, setupActionDelegation } from './modules/dom.js';
import { fetchProvinces, fetchCitiesMunicipalities, getOfflineQueue, saveToOfflineQueue, removeFromOfflineQueue } from './modules/async.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("e-Barangay Portal Initialized.");

  const reliefPacker = createReliefPacker(1000);

  const provinceSelect = document.getElementById('prov-select');
  const citySelect = document.getElementById('city-select');
  const applicationForm = document.getElementById('ayuda-form');
  const queueContainer = document.getElementById('queue-container');
  const posContainer = document.getElementById('pos-container');
  const addItemBtn = document.getElementById('add-item-btn');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');

  let provincesData = [];

  // 1. Populate Provinces on Load
  if (provinceSelect) {
    provincesData = await fetchProvinces();
    provinceSelect.innerHTML = '<option value="">Select Province...</option>' + 
      provincesData.map(p => `<option value="${p.code}">${p.name}</option>`).join('');

    provinceSelect.addEventListener('change', async (e) => {
      const provinceCode = e.target.value;
      citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
      
      if (!provinceCode) return;

      const cities = await fetchCitiesMunicipalities(provinceCode);
      citySelect.innerHTML = '<option value="">Select City/Municipality...</option>' + 
        cities.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
    });
  }

  function refreshUI() {
    const queue = getOfflineQueue();
    if (queueContainer) {
      renderResidentCards(queueContainer, queue);
    }
    if (posContainer) {
      renderPOSRegister(posContainer, reliefPacker);
    }
  }

  refreshUI();

  // 2. Handle Resident Registration Submission
  if (applicationForm) {
    applicationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const provinceCode = provinceSelect.value;
      const cityCode = citySelect.value;
      
      // Get human-readable text for province and city
      const selectedProvinceOpt = provinceSelect.options[provinceSelect.selectedIndex];
      const selectedCityOpt = citySelect.options[citySelect.selectedIndex];
      
      const province = selectedProvinceOpt ? selectedProvinceOpt.text : '';
      const city = selectedCityOpt ? selectedCityOpt.text : '';

      const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
      const isSenior = document.getElementById('is-senior').checked;
      const isPWD = document.getElementById('is-pwd').checked;
      const dependentCount = parseInt(document.getElementById('dependent-count').value, 10) || 0;

      const evaluation = evaluateAyudaEligibility({
        isSenior,
        isPWD,
        monthlyIncome,
        dependentCount
      });

      const newApplication = {
        id: 'app_' + Date.now(),
        name,
        province,
        city,
        monthlyIncome,
        ...evaluation
      };

      saveToOfflineQueue(newApplication);
      applicationForm.reset();
      citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
      refreshUI();
    });
  }

  // 3. Handle POS Item Addition
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      const itemName = itemNameInput.value.trim();
      const itemPrice = parseFloat(itemPriceInput.value) || 0;

      if (!itemName) return;

      const result = reliefPacker.addItem(itemName, itemPrice);
      if (!result.success) {
        alert(result.reason || 'Cannot add item: exceeds budget cap.');
        return;
      }

      itemNameInput.value = '';
      itemPriceInput.value = '';
      refreshUI();
    });
  }

  // 4. Action Delegation (matching the action names in dom.js)
  setupActionDelegation(document.body, {
    'remove-pos-item': (event, trigger) => {
      const index = parseInt(trigger.getAttribute('data-index'), 10);
      reliefPacker.removeItem(index);
      refreshUI();
    },
    'remove-resident': (event, trigger) => {
      const id = trigger.getAttribute('data-id');
      removeFromOfflineQueue(id);
      refreshUI();
    }
  });
});
/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */

import { evaluateAyudaEligibility, createReliefPacker } from './modules/engine.js';
import { renderResidentCards, renderPOSRegister, setupActionDelegation } from './modules/dom.js';
import { fetchProvinces, fetchCitiesMunicipalities, fetchBarangays, getOfflineQueue, saveToOfflineQueue, removeFromOfflineQueue } from './modules/async.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("e-Barangay Portal Initialized.");

  const reliefPacker = createReliefPacker(1000);

  const provinceSelect = document.getElementById('prov-select');
  const citySelect = document.getElementById('city-select');
  const barangaySelect = document.getElementById('barangay-select');
  const applicationForm = document.getElementById('ayuda-form');
  const queueContainer = document.getElementById('queue-container');
  const posContainer = document.getElementById('pos-container');
  const addItemBtn = document.getElementById('add-item-btn');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');

  // 1. Cascading Province -> City -> Barangay Dropdowns
  if (provinceSelect) {
    const provincesData = await fetchProvinces();
    provinceSelect.innerHTML = '<option value="">Select Province...</option>' + 
      provincesData.map(p => `<option value="${p.code}">${p.name}</option>`).join('');

    provinceSelect.addEventListener('change', async (e) => {
      const provinceCode = e.target.value;
      citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
      barangaySelect.innerHTML = '<option value="">Select Barangay...</option>';
      
      if (!provinceCode) return;

      const cities = await fetchCitiesMunicipalities(provinceCode);
      citySelect.innerHTML = '<option value="">Select City/Municipality...</option>' + 
        cities.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
    });

    citySelect.addEventListener('change', async (e) => {
      const cityCode = e.target.value;
      barangaySelect.innerHTML = '<option value="">Select Barangay...</option>';

      if (!cityCode) return;

      const barangays = await fetchBarangays(cityCode);
      barangaySelect.innerHTML = '<option value="">Select Barangay...</option>' + 
        barangays.map(b => `<option value="${b.code}">${b.name}</option>`).join('');
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

  // 2. Handle Form Submission
  if (applicationForm) {
    applicationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      
      const selectedProvinceOpt = provinceSelect.options[provinceSelect.selectedIndex];
      const selectedCityOpt = citySelect.options[citySelect.selectedIndex];
      const selectedBarangayOpt = barangaySelect.options[barangaySelect.selectedIndex];
      
      const province = selectedProvinceOpt ? selectedProvinceOpt.text : '';
      const city = selectedCityOpt ? selectedCityOpt.text : '';
      const barangay = selectedBarangayOpt ? selectedBarangayOpt.text : '';

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
        barangay,
        monthlyIncome,
        ...evaluation
      };

      saveToOfflineQueue(newApplication);
      applicationForm.reset();
      citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
      barangaySelect.innerHTML = '<option value="">Select Barangay...</option>';
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

  // 4. Action Delegation
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
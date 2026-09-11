/**
 * [INTEGRATION] Main Entrypoint Module
 */

import { evaluateAyudaEligibility, createReliefPacker } from './modules/engine.js';
import { fetchProvinces, fetchCitiesMunicipalities, getOfflineQueue, saveToOfflineQueue, removeFromOfflineQueue } from './modules/async.js';
import { renderResidentCards, renderPOSRegister, setupActionDelegation } from './modules/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("e-Barangay Portal Initialized.");

  const reliefPacker = createReliefPacker(1000);

  // 1. DOM Declarations (Safe Fallbacks)
  const forms = document.querySelectorAll('form');
  const residentForm = document.getElementById('resident-form') || forms[0];
  const posForm = document.getElementById('pos-form') || forms[1];

  const selects = document.querySelectorAll('select');
  const provinceSelect = document.getElementById('province-select') || selects[0];
  const citySelect = document.getElementById('city-select') || selects[1];

  const posContainer = document.getElementById('pos-container') || 
                       document.querySelector('.pos-register') || 
                       document.querySelectorAll('main > div, section, .card, div.bg-white')[1];

  const cardsContainer = document.getElementById('resident-cards-container') || 
                         document.getElementById('registered-queue') || 
                         document.querySelector('.registered-queue') || 
                         document.querySelectorAll('main > div, section, .card, div.bg-white')[2];

  // Helper Functions
  const refreshResidentList = () => {
    const queue = getOfflineQueue();
    const target = cardsContainer || document.querySelectorAll('main > div, section, .card, div.bg-white')[2];
    if (target && target !== residentForm) {
      renderResidentCards(target, queue);
    }
  };

  const refreshPOS = () => {
    const target = posContainer || document.querySelectorAll('main > div, section, .card, div.bg-white')[1];
    if (target) {
      renderPOSRegister(target, reliefPacker);
    }
  };

  // Initial Loads
  refreshResidentList();
  refreshPOS();

  // Load Provinces
  if (provinceSelect) {
    const provinces = await fetchProvinces();
    if (provinces && provinces.length > 0) {
      provinceSelect.innerHTML = '<option value="">Select Province</option>' + 
        provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
    }
  }

  // Load Cities (Cascading)
  if (provinceSelect && citySelect) {
    provinceSelect.addEventListener('change', async (e) => {
      const provinceCode = e.target.value;
      citySelect.innerHTML = '<option value="">Loading cities...</option>';
      
      if (!provinceCode) {
        citySelect.innerHTML = '<option value="">Select City/Municipality</option>';
        return;
      }

      const cities = await fetchCitiesMunicipalities(provinceCode);
      if (cities && cities.length > 0) {
        citySelect.innerHTML = '<option value="">Select City/Municipality</option>' + 
          cities.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      } else {
        citySelect.innerHTML = '<option value="">Select City/Municipality</option>';
      }
    });
  }

  // 2. Evaluate & Register Submission
  // 2. Evaluate & Register Submission
  if (residentForm) {
    residentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // --- HONESTY & CONFIRMATION CHECK ---
      const isHonest = confirm(
        "Information Declaration:\n\n" +
        "Please confirm that all the information provided is accurate, honest, and truthful.\n\n" +
        "Click 'OK' to proceed with the registration."
      );

      // Stop registration if the user cancels
      if (!isHonest) {
        return; 
      }
      // ------------------------------------

      const allInputs = Array.from(residentForm.querySelectorAll('input'));
      const checkboxes = residentForm.querySelectorAll('input[type="checkbox"]');

      const nameInput = allInputs.find(i => i.type === 'text') || allInputs[0];
      const numberInputs = allInputs.filter(i => i.type === 'number');

      const incomeInput = numberInputs[0] || allInputs[1];
      const dependentsInput = numberInputs[1] || allInputs[2];

      const citizen = {
        fullName: nameInput?.value.trim() || 'Anonymous',
        isSenior: checkboxes[0]?.checked || false,
        isPWD: checkboxes[1]?.checked || false,
        monthlyIncome: incomeInput?.value !== '' ? parseFloat(incomeInput.value) : 0,
        dependentCount: dependentsInput?.value !== '' ? parseInt(dependentsInput.value, 10) : 0
      };

      // Engine Evaluation
      const evaluation = evaluateAyudaEligibility(citizen);

      const provinceName = provinceSelect && provinceSelect.selectedIndex > 0 
        ? provinceSelect.options[provinceSelect.selectedIndex].text 
        : '';
      const cityName = citySelect ? citySelect.value : '';

      const applicationRecord = {
        id: Date.now().toString(),
        fullName: citizen.fullName,
        province: provinceName,
        city: cityName,
        priority: evaluation.priority || 'MEDIUM',
        score: evaluation.score,
        approved: evaluation.approved
      };

      saveToOfflineQueue(applicationRecord);
      refreshResidentList();

      // Success notification after adding to the queue below
      alert(`Successfully registered ${citizen.fullName}! You can view their status in the Registered Queue below.`);

      // Clear Form Inputs
      if (nameInput) nameInput.value = '';
      if (incomeInput) incomeInput.value = '';
      if (dependentsInput) dependentsInput.value = '0';
      checkboxes.forEach(cb => cb.checked = false);
    });
  }
  // 3. POS Add Item Submission (Direct Button & Container Search)
  const addItemBtn = document.querySelector('button[type="submit"]:not(#resident-form button)') || 
                     document.querySelectorAll('button')[1];

  if (addItemBtn) {
    addItemBtn.addEventListener('click', (e) => {
      // Hanapin ang pinakamalapit na POS section/container
      const posSection = addItemBtn.closest('section') || addItemBtn.closest('form') || addItemBtn.closest('div.card');
      if (!posSection) return;

      const posInputs = posSection.querySelectorAll('input');
      const nameInput = document.getElementById('item-name') || posInputs[0];
      const priceInput = document.getElementById('item-price') || posInputs[1];

      const name = nameInput?.value.trim();
      const price = parseFloat(priceInput?.value);

      if (name && !isNaN(price) && price > 0) {
        e.preventDefault(); // Pipigilan ang page reload kapag valid
        
        const result = reliefPacker.addItem(name, price);
        if (result && result.success === false) {
          alert(result.reason || 'Cannot add item: Exceeds budget cap!');
        } else {
          if (nameInput) nameInput.value = '';
          if (priceInput) priceInput.value = '';
          refreshPOS();
        }
      }
    });
  }

  // 4. Action Delegation (Remove Buttons)
  setupActionDelegation(document.body, {
    'remove-resident': (target) => {
      const id = target.dataset.id;
      if (id) {
        removeFromOfflineQueue(id);
        refreshResidentList();
      }
    },
    'remove-item': (target) => {
      const index = parseInt(target.dataset.index, 10);
      if (!isNaN(index)) {
        reliefPacker.removeItem(index);
        refreshPOS();
      }
    }
  });
});
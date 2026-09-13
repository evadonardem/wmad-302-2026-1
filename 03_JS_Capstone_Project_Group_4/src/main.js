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
  const residentForm = document.getElementById('ayuda-form');
  const provinceSelect = document.getElementById('prov-select');
  const citySelect = document.getElementById('city-select');

  const posContainer = document.getElementById('pos-container') || 
                       document.querySelector('.pos-register') || 
                       document.querySelectorAll('main > div, section, .card, div.bg-white')[1];

  const cardsContainer = document.getElementById('registered-queue') || 
                         document.getElementById('resident-cards-container') || 
                         document.querySelector('.registered-queue');

  const searchInput = document.getElementById('search-input');
  const filterPrioritySelect = document.getElementById('filter-priority');

  // Dashboard Stats Update Function
  const updateDashboardStats = (queue) => {
    const total = queue.length;
    const critical = queue.filter(r => (r.priority && r.priority.toUpperCase() === 'CRITICAL') || r.score >= 80).length;
    const highMedium = queue.filter(r => {
      const prio = r.priority ? r.priority.toUpperCase() : '';
      return prio === 'HIGH' || prio === 'MEDIUM' || (r.score >= 40 && r.score < 80);
    }).length;
    const low = queue.filter(r => (r.priority && r.priority.toUpperCase() === 'LOW') || (r.score !== undefined && r.score < 40)).length;

    const statTotalEl = document.getElementById('stat-total');
    const statCriticalEl = document.getElementById('stat-critical');
    const statHighEl = document.getElementById('stat-high');
    const statLowEl = document.getElementById('stat-low');

    if (statTotalEl) statTotalEl.innerText = total;
    if (statCriticalEl) statCriticalEl.innerText = critical;
    if (statHighEl) statHighEl.innerText = highMedium;
    if (statLowEl) statLowEl.innerText = low;
  };

  // Helper Functions
  const refreshResidentList = () => {
    let queue = getOfflineQueue();
    updateDashboardStats(queue);

    // Filter Logic based on Search & Select Inputs
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedPriority = filterPrioritySelect ? filterPrioritySelect.value : 'ALL';

    if (query) {
      queue = queue.filter(r => r.fullName && r.fullName.toLowerCase().includes(query));
    }

    if (selectedPriority !== 'ALL') {
      queue = queue.filter(r => r.priority && r.priority.toUpperCase() === selectedPriority);
    }

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

  // Search & Filter Event Listeners
  if (searchInput) searchInput.addEventListener('input', refreshResidentList);
  if (filterPrioritySelect) filterPrioritySelect.addEventListener('change', refreshResidentList);

  // Initial Loads
  refreshResidentList();
  refreshPOS();

  // Load Provinces
  if (provinceSelect) {
    const provinces = await fetchProvinces();
    if (provinces && provinces.length > 0) {
      provinceSelect.innerHTML = '<option value="">Select Province...</option>' + 
        provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
    }
  }

  // Load Cities (Cascading)
  if (provinceSelect && citySelect) {
    provinceSelect.addEventListener('change', async (e) => {
      const provinceCode = e.target.value;
      citySelect.innerHTML = '<option value="">Loading cities...</option>';
      
      if (!provinceCode) {
        citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
        return;
      }

      const cities = await fetchCitiesMunicipalities(provinceCode);
      if (cities && cities.length > 0) {
        citySelect.innerHTML = '<option value="">Select City/Municipality...</option>' + 
          cities.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      } else {
        citySelect.innerHTML = '<option value="">Select City/Municipality...</option>';
      }
    });
  }

  // 2. Evaluate & Register Submission
  if (residentForm) {
    residentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const isHonest = confirm(
        "Information Declaration:\n\n" +
        "Please confirm that all the information provided is accurate, honest, and truthful.\n\n" +
        "Click 'OK' to proceed with the registration."
      );

      if (!isHonest) {
        return; 
      }

      const allInputs = Array.from(residentForm.querySelectorAll('input'));
      const checkboxes = residentForm.querySelectorAll('input[type="checkbox"]');

      const nameInput = document.getElementById('name') || allInputs.find(i => i.type === 'text') || allInputs[0];
      const numberInputs = allInputs.filter(i => i.type === 'number');

      const incomeInput = document.getElementById('monthly-income') || numberInputs[0] || allInputs[1];
      const dependentsInput = document.getElementById('dependent-count') || numberInputs[1] || allInputs[2];

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

      // Success notification
      alert(`Successfully registered ${citizen.fullName}! You can view their status in the Registered Queue below.`);

      // Clear Form Inputs
      if (nameInput) nameInput.value = '';
      if (incomeInput) incomeInput.value = '';
      if (dependentsInput) dependentsInput.value = '0';
      checkboxes.forEach(cb => cb.checked = false);
    });
  }

  // 3. POS Add Item Submission
  const addItemBtn = document.getElementById('add-item-btn') || 
                     document.querySelector('button[type="submit"]:not(#ayuda-form button)') || 
                     document.querySelectorAll('button')[1];

  if (addItemBtn) {
    addItemBtn.addEventListener('click', (e) => {
      const posSection = addItemBtn.closest('section') || addItemBtn.closest('form') || addItemBtn.closest('div.card');
      if (!posSection) return;

      const posInputs = posSection.querySelectorAll('input');
      const nameInput = document.getElementById('item-name') || posInputs[0];
      const priceInput = document.getElementById('item-price') || posInputs[1];

      const name = nameInput?.value.trim();
      const price = parseFloat(priceInput?.value);

      if (name && !isNaN(price) && price > 0) {
        e.preventDefault(); 
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
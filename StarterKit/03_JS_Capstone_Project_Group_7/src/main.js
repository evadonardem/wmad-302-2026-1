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

  // =========================
  // DOM ELEMENTS
  // =========================

  const form = document.getElementById('ayuda-form');

  const nameInput = document.getElementById('name');
  const provinceSelect = document.getElementById('prov-select');
  const citySelect = document.getElementById('city-select');
  const incomeInput = document.getElementById('monthly-income');
  const seniorCheckbox = document.getElementById('is-senior');
  const pwdCheckbox = document.getElementById('is-pwd');
  const dependentInput = document.getElementById('dependent-count');

  const queueContainer = document.getElementById('queue-container');

  const posContainer = document.getElementById('pos-container');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');
  const addItemButton = document.getElementById('add-item-btn');


  // =========================
  // APPLICATION QUEUE
  // =========================

  let residents = getOfflineQueue();

  renderResidentCards(queueContainer, residents);


  // =========================
  // PROVINCE DROPDOWN
  // =========================

  const provinces = await fetchProvinces();

  provinceSelect.innerHTML = `
    <option value="">Select Province...</option>
  `;

  provinces.forEach(province => {
    const option = document.createElement('option');

    option.value = province.code;
    option.textContent = province.name;

    provinceSelect.appendChild(option);
  });


  // =========================
  // CITY / MUNICIPALITY
  // =========================

  provinceSelect.addEventListener('change', async () => {
    const provinceCode = provinceSelect.value;

    citySelect.innerHTML = `
      <option value="">Loading...</option>
    `;

    if (!provinceCode) {
      citySelect.innerHTML = `
        <option value="">Select City/Municipality...</option>
      `;
      return;
    }

    const cities = await fetchCitiesMunicipalities(provinceCode);

    citySelect.innerHTML = `
      <option value="">Select City/Municipality...</option>
    `;

    cities.forEach(city => {
      const option = document.createElement('option');

      option.value = city.code;
      option.textContent = city.name;

      citySelect.appendChild(option);
    });
  });


  // =========================
  // AYUDA FORM SUBMISSION
  // =========================

  form.addEventListener('submit', event => {
    event.preventDefault();

    const selectedProvince =
      provinceSelect.options[provinceSelect.selectedIndex];

    const selectedCity =
      citySelect.options[citySelect.selectedIndex];


    const citizen = {
      id: Date.now().toString(),

      name: nameInput.value.trim(),

      province: selectedProvince
        ? selectedProvince.textContent
        : '',

      city: selectedCity
        ? selectedCity.textContent
        : '',

      monthlyIncome: Number(incomeInput.value),

      isSenior: seniorCheckbox.checked,

      isPWD: pwdCheckbox.checked,

      dependentCount: Number(dependentInput.value) || 0
    };


    // Evaluate eligibility
    const result = evaluateAyudaEligibility(citizen);


    const application = {
      ...citizen,
      ...result
    };


    // Add to local queue
    residents.push(application);

    saveToOfflineQueue(application);

    // Re-render queue
    renderResidentCards(queueContainer, residents);


    // Reset form
    form.reset();

    citySelect.innerHTML = `
      <option value="">Select City/Municipality...</option>
    `;

    alert(
      `Application registered!\n\n` +
      `Priority: ${result.priority}\n` +
      `Score: ${result.score}\n` +
      `Approved: ${result.approved ? 'Yes' : 'No'}`
    );
  });


  // =========================
  // RELIEF PACKER POS
  // =========================

  const reliefPacker = createReliefPacker(1000);

  renderPOSRegister(posContainer, reliefPacker);


  // Add item
  addItemButton.addEventListener('click', () => {
    const itemName = itemNameInput.value.trim();
    const itemPrice = Number(itemPriceInput.value);

    const result = reliefPacker.addItem(
      itemName,
      itemPrice
    );


    if (!result.success) {
      alert(result.reason);
      return;
    }


    itemNameInput.value = '';
    itemPriceInput.value = '';

    renderPOSRegister(
      posContainer,
      reliefPacker
    );
  });


  // =========================
  // EVENT DELEGATION
  // =========================

  setupActionDelegation(
    document,
    {

      // Remove resident
      'remove-resident': actionElement => {
        const id = actionElement.dataset.id;

        residents = residents.filter(
          resident => resident.id !== id
        );

        removeFromOfflineQueue(id);

        renderResidentCards(
          queueContainer,
          residents
        );
      },


      // Remove POS item
      'remove-item': actionElement => {
        const index = Number(
          actionElement.dataset.index
        );

        reliefPacker.removeItem(index);

        renderPOSRegister(
          posContainer,
          reliefPacker
        );
      }

    }
  );
});
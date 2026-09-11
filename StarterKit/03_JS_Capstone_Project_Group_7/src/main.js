import {
  evaluateAyudaEligibility,
  getAyudaLimit,
  createReliefPacker
} from './modules/engine.js';

import {
  renderResidentCards,
  renderResidentEditForm,
  renderPOSRegister,
  setupActionDelegation
} from './modules/dom.js';

import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  getOfflineQueue,
  saveToOfflineQueue,
  removeFromOfflineQueue,
  getDraftPackage,
  saveDraftPackage,
  clearDraftPackage
} from './modules/async.js';


document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      "e-Barangay Starter Kit Initialized. Happy Coding!"
    );


    // =========================================
    // DOM ELEMENTS
    // =========================================

    const form = document.getElementById('ayuda-form');
    const nameInput = document.getElementById('name');
    const provinceSelect = document.getElementById('prov-select');
    const citySelect = document.getElementById('city-select');
    const incomeInput = document.getElementById('monthly-income');
    const seniorCheckbox = document.getElementById('is-senior');
    const pwdCheckbox = document.getElementById('is-pwd');
    const dependentInput = document.getElementById('dependent-count');
    const queueContainer = document.getElementById('queue-container');

    // POS elements
    const posContainer = document.getElementById('pos-container');
    const recipientSelect = document.getElementById('recipient-select');
    const recipientInfo = document.getElementById('recipient-info');
    const itemNameInput = document.getElementById('item-name');
    const itemPriceInput = document.getElementById('item-price');
    const addItemButton = document.getElementById('add-item-btn');
    const registerAyudaButton = document.getElementById('register-ayuda-btn');


    // =========================================
    // MOBILE SIDEBAR TOGGLE
    // =========================================

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {

      menuToggle.addEventListener(
        'click',
        () => {
          sidebar.classList.toggle('open');
        }
      );

      document
        .querySelectorAll('[data-nav]')
        .forEach(link => {

          link.addEventListener(
            'click',
            () => {

              if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
              }

            }
          );

        });

    }


    // =========================================
    // RESIDENT DATA
    // =========================================

    let residents = getOfflineQueue();

    let selectedResidentId = null;

    let reliefPacker = createReliefPacker(1000);

    renderResidentCards(queueContainer, residents);


    // =========================================
    // UPDATE RECIPIENT DROPDOWN
    // =========================================

    function updateRecipientSelect() {

      recipientSelect.innerHTML = `
        <option value="">
          Select Registered Resident...
        </option>
      `;

      residents.forEach(resident => {

        const option = document.createElement('option');

        option.value = resident.id;

        option.textContent = resident.name;

        recipientSelect.appendChild(option);

      });

    }

    updateRecipientSelect();


    // =========================================
    // PROVINCES
    // =========================================

    const provinces = await fetchProvinces();

    provinceSelect.innerHTML = `
      <option value="">
        Select Province...
      </option>
    `;

    provinces.forEach(province => {

      const option = document.createElement('option');

      option.value = province.code;

      option.textContent = province.name;

      provinceSelect.appendChild(option);

    });


    // =========================================
    // CITY / MUNICIPALITY
    // =========================================

    provinceSelect.addEventListener(
      'change',
      async () => {

        const provinceCode = provinceSelect.value;

        citySelect.innerHTML = `
          <option value="">
            Loading...
          </option>
        `;

        if (!provinceCode) {

          citySelect.innerHTML = `
            <option value="">
              Select City/Municipality...
            </option>
          `;

          return;
        }

        const cities = await fetchCitiesMunicipalities(provinceCode);

        citySelect.innerHTML = `
          <option value="">
            Select City/Municipality...
          </option>
        `;

        cities.forEach(city => {

          const option = document.createElement('option');

          option.value = city.code;

          option.textContent = city.name;

          citySelect.appendChild(option);

        });

      }
    );


    // =========================================
    // REGISTER RESIDENT
    // =========================================

    form.addEventListener(
      'submit',
      event => {

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

        const result = evaluateAyudaEligibility(citizen);

        const ayudaLimit = getAyudaLimit(result.priority);

        const application = {

          ...citizen,

          ...result,

          ayudaLimit,

          ayudaItems: [],

          ayudaTotal: 0

        };

        residents.push(application);

        saveToOfflineQueue(application);

        renderResidentCards(queueContainer, residents);

        updateRecipientSelect();

        form.reset();

        citySelect.innerHTML = `
          <option value="">
            Select City/Municipality...
          </option>
        `;

        alert(
          `Application registered!\n\n` +
          `Priority: ${result.priority}\n` +
          `Score: ${result.score}\n` +
          `Status: ${result.approved ? 'Approved' : 'Not Approved'}\n` +
          `Maximum Ayuda: ₱${ayudaLimit.toFixed(2)}`
        );

      }
    );


    // =========================================
    // SELECT RECIPIENT
    // =========================================

    recipientSelect.addEventListener(
      'change',
      () => {

        selectedResidentId = recipientSelect.value || null;

        if (!selectedResidentId) {

          reliefPacker = createReliefPacker(1000);

          recipientInfo.innerHTML = '';

          renderPOSRegister(posContainer, reliefPacker, null);

          registerAyudaButton.disabled = true;

          return;
        }

        const resident = residents.find(
          item => item.id === selectedResidentId
        );

        if (!resident) {
          return;
        }

        const ayudaLimit = Number(
          resident.ayudaLimit ?? getAyudaLimit(resident.priority)
        );

        const ayudaTotal = Number(resident.ayudaTotal ?? 0);

        const remaining = Math.max(0, ayudaLimit - ayudaTotal);

        reliefPacker = createReliefPacker(remaining);

        const draft = getDraftPackage(selectedResidentId);

        if (draft && Array.isArray(draft.items)) {

          draft.items.forEach(item => {
            reliefPacker.addItem(item.name, item.price);
          });

        }

        recipientInfo.innerHTML = '';

        renderPOSRegister(posContainer, reliefPacker, resident);

        registerAyudaButton.disabled = remaining <= 0;

      }
    );


    // =========================================
    // ADD ITEM TO CURRENT PACKAGE
    // =========================================

    addItemButton.addEventListener(
      'click',
      () => {

        if (!selectedResidentId) {

          alert('Please select a registered resident first.');

          return;
        }

        const itemName = itemNameInput.value.trim();
        const itemPrice = Number(itemPriceInput.value);

        const result = reliefPacker.addItem(itemName, itemPrice);

        if (!result.success) {

          alert(result.reason);

          return;
        }

        saveDraftPackage(
          selectedResidentId,
          reliefPacker.getItems(),
          reliefPacker.getTotal()
        );

        itemNameInput.value = '';
        itemPriceInput.value = '';

        const resident = residents.find(
          item => item.id === selectedResidentId
        );

        renderPOSRegister(posContainer, reliefPacker, resident);

      }
    );


    // =========================================
    // REGISTER AYUDA
    // =========================================

    registerAyudaButton.addEventListener(
      'click',
      () => {

        if (!selectedResidentId) {

          alert('Please select a recipient first.');

          return;
        }

        const residentIndex = residents.findIndex(
          item => item.id === selectedResidentId
        );

        if (residentIndex === -1) {

          alert('Resident not found.');

          return;
        }

        const resident = residents[residentIndex];

        const items = reliefPacker.getItems();
        const packageTotal = reliefPacker.getTotal();

        if (items.length === 0) {

          alert('Please add at least one ayuda item.');

          return;
        }

        const currentItems = Array.isArray(resident.ayudaItems)
          ? resident.ayudaItems
          : [];

        const updatedItems = [...currentItems, ...items];

        const updatedTotal =
          Number(resident.ayudaTotal ?? 0) + packageTotal;

        const ayudaLimit = Number(
          resident.ayudaLimit ?? getAyudaLimit(resident.priority)
        );

        if (updatedTotal > ayudaLimit) {

          alert('This package exceeds the resident\'s ayuda allocation.');

          return;
        }

        const updatedResident = {

          ...resident,

          ayudaLimit,

          ayudaItems: updatedItems,

          ayudaTotal: updatedTotal

        };

        residents[residentIndex] = updatedResident;

        removeFromOfflineQueue(selectedResidentId);
        saveToOfflineQueue(updatedResident);

        clearDraftPackage(selectedResidentId);

        renderResidentCards(queueContainer, residents);

        reliefPacker = createReliefPacker(
          Math.max(0, ayudaLimit - updatedTotal)
        );

        itemNameInput.value = '';
        itemPriceInput.value = '';

        recipientSelect.dispatchEvent(new Event('change'));

        alert(
          `Ayuda registered successfully!\n\n` +
          `Recipient: ${updatedResident.name}\n` +
          `Amount Given: ₱${packageTotal.toFixed(2)}\n` +
          `Total Given: ₱${updatedTotal.toFixed(2)}\n` +
          `Remaining: ₱${Math.max(0, ayudaLimit - updatedTotal).toFixed(2)}`
        );

      }
    );


    // =========================================
    // EVENT DELEGATION
    // =========================================

    setupActionDelegation(
      document,
      {

        'edit-resident': actionElement => {

          const id = actionElement.dataset.id;

          const resident = residents.find(
            item => item.id === id
          );

          if (!resident) return;

          const card = actionElement.closest('.resident-card');

          if (!card) return;

          renderResidentEditForm(card, resident);

        },


        'save-resident': actionElement => {

          const id = actionElement.dataset.id;

          const card = actionElement.closest('.resident-card');

          if (!card) return;

          const residentIndex = residents.findIndex(
            item => item.id === id
          );

          if (residentIndex === -1) return;

          const oldResident = residents[residentIndex];

          const name = card.querySelector('.edit-name').value.trim();
          const province = card.querySelector('.edit-province').value.trim();
          const city = card.querySelector('.edit-city').value.trim();

          const monthlyIncome = Number(
            card.querySelector('.edit-income').value
          );

          const isSenior = card.querySelector('.edit-senior').checked;
          const isPWD = card.querySelector('.edit-pwd').checked;

          const dependentCount = Number(
            card.querySelector('.edit-dependents').value
          ) || 0;

          if (!name) {

            alert('Please enter the resident name.');

            return;
          }

          if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {

            alert('Please enter a valid monthly income.');

            return;
          }

          const updatedCitizen = {

            id,

            name,

            province,

            city,

            monthlyIncome,

            isSenior,

            isPWD,

            dependentCount

          };

          const result = evaluateAyudaEligibility(updatedCitizen);

          const newAyudaLimit = getAyudaLimit(result.priority);

          const previousAyudaItems = Array.isArray(oldResident.ayudaItems)
            ? oldResident.ayudaItems
            : [];

          const previousAyudaTotal = Number(
            oldResident.ayudaTotal ?? 0
          );

          const updatedResident = {

            ...updatedCitizen,

            ...result,

            ayudaLimit: newAyudaLimit,

            ayudaItems: previousAyudaItems,

            ayudaTotal: previousAyudaTotal

          };

          residents[residentIndex] = updatedResident;

          removeFromOfflineQueue(id);
          saveToOfflineQueue(updatedResident);

          renderResidentCards(queueContainer, residents);

          updateRecipientSelect();

          if (selectedResidentId === id) {

            recipientSelect.value = id;

            recipientSelect.dispatchEvent(new Event('change'));

          }

          alert('Resident information updated!');

        },


        'cancel-edit': () => {

          renderResidentCards(queueContainer, residents);

        },


        'remove-resident': actionElement => {

          const id = actionElement.dataset.id;

          residents = residents.filter(
            resident => resident.id !== id
          );

          removeFromOfflineQueue(id);

          clearDraftPackage(id);

          if (selectedResidentId === id) {

            selectedResidentId = null;

            recipientSelect.value = '';

            reliefPacker = createReliefPacker(1000);

            renderPOSRegister(posContainer, reliefPacker, null);

            registerAyudaButton.disabled = true;

          }

          renderResidentCards(queueContainer, residents);

          updateRecipientSelect();

        },


        'remove-item': actionElement => {

          const index = Number(actionElement.dataset.index);

          reliefPacker.removeItem(index);

          const resident = residents.find(
            item => item.id === selectedResidentId
          );

          renderPOSRegister(posContainer, reliefPacker, resident);

          saveDraftPackage(
            selectedResidentId,
            reliefPacker.getItems(),
            reliefPacker.getTotal()
          );

        }

      }
    );

  }
);
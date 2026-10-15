import {
  evaluateAyudaEligibility,
  createReliefPacker
} from './modules/engine.js';

import {
  renderResidentCards,
  renderPOSRegister,
  setupActionDelegation,
  sanitizeHTML
} from './modules/dom.js';

import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  fetchBarangays,
  getOfflineQueue,
  saveToOfflineQueue,
  removeFromOfflineQueue
} from './modules/async.js';

document.addEventListener(
  'DOMContentLoaded',
  async () => {
    console.log(
      'e-Barangay Starter Kit Initialized. Happy Coding!'
    );

    const ayudaForm =
      document.getElementById('ayuda-form');

    const nameInput =
      document.getElementById('name');

    const provinceSelect =
      document.getElementById('prov-select');

    const citySelect =
      document.getElementById('city-select');

    const barangaySelect =
      document.getElementById('barangay-select');

    const monthlyIncomeInput =
      document.getElementById('monthly-income');

    const seniorInput =
      document.getElementById('is-senior');

    const pwdInput =
      document.getElementById('is-pwd');

    const dependentInput =
      document.getElementById('dependent-count');

    const queueContainer =
      document.getElementById('queue-container');

    const queueSearch =
      document.getElementById('queue-search');

    const queueCount =
      document.getElementById('queue-count');

    const priorityFilterButtons =
      document.querySelectorAll(
        '.priority-filter'
      );

    const posContainer =
      document.getElementById('pos-container');

    const itemNameInput =
      document.getElementById('item-name');

    const itemPriceInput =
      document.getElementById('item-price');

    const addItemButton =
      document.getElementById('add-item-btn');

    let residents = getOfflineQueue();

    let provinces = [];

    let selectedPriority = '';

    const reliefPacker =
      createReliefPacker();

    const renderQueue = () => {
      if (!queueContainer) return;

      const searchValue =
        queueSearch?.value
          .trim()
          .toLowerCase() ?? '';

      const filteredResidents =
        residents.filter((resident) => {
          const residentName =
            String(
              resident.name ?? ''
            ).toLowerCase();

          const matchesSearch =
            !searchValue ||
            residentName.includes(
              searchValue
            );

          const matchesPriority =
            !selectedPriority ||
            resident.priority ===
              selectedPriority;

          return (
            matchesSearch &&
            matchesPriority
          );
        });

      renderResidentCards(
        queueContainer,
        filteredResidents
      );

      if (queueCount) {
        queueCount.textContent =
          filteredResidents.length;
      }
    };

    const refreshQueue = () => {
      residents =
        getOfflineQueue();

      renderQueue();
    };

    const renderPOS = () => {
      renderPOSRegister(
        posContainer,
        reliefPacker
      );
    };

    refreshQueue();
    renderPOS();

    if (provinceSelect) {
      provinces =
        await fetchProvinces();

      provinceSelect.innerHTML = `
        <option value="">
          Select Province...
        </option>

        ${provinces
          .map(
            (province) => `
              <option
                value="${sanitizeHTML(
                  province.code
                )}"
              >
                ${sanitizeHTML(
                  province.name
                )}
              </option>
            `
          )
          .join('')}
      `;
    }

    if (
      provinceSelect &&
      citySelect
    ) {
      provinceSelect.addEventListener(
        'change',
        async () => {
          const provinceCode =
            provinceSelect.value;

          citySelect.innerHTML = `
            <option value="">
              Loading...
            </option>
          `;

          citySelect.disabled = true;

          if (barangaySelect) {
            barangaySelect.innerHTML = `
              <option value="">
                Select Barangay...
              </option>
            `;

            barangaySelect.disabled =
              true;
          }

          if (!provinceCode) {
            citySelect.innerHTML = `
              <option value="">
                Select City/Municipality...
              </option>
            `;

            return;
          }

          const citiesMunicipalities =
            await fetchCitiesMunicipalities(
              provinceCode
            );

          citySelect.innerHTML = `
            <option value="">
              Select City/Municipality...
            </option>

            ${citiesMunicipalities
              .map(
                (city) => `
                  <option
                    value="${sanitizeHTML(
                      city.code
                    )}"
                  >
                    ${sanitizeHTML(
                      city.name
                    )}
                  </option>
                `
              )
              .join('')}
          `;

          citySelect.disabled = false;
        }
      );
    }

    if (
      citySelect &&
      barangaySelect
    ) {
      citySelect.addEventListener(
        'change',
        async () => {
          const cityCode =
            citySelect.value;

          barangaySelect.innerHTML = `
            <option value="">
              Loading...
            </option>
          `;

          barangaySelect.disabled =
            true;

          if (!cityCode) {
            barangaySelect.innerHTML = `
              <option value="">
                Select Barangay...
              </option>
            `;

            return;
          }

          const barangays =
            await fetchBarangays(
              cityCode
            );

          barangaySelect.innerHTML = `
            <option value="">
              Select Barangay...
            </option>

            ${barangays
              .map(
                (barangay) => `
                  <option
                    value="${sanitizeHTML(
                      barangay.code
                    )}"
                  >
                    ${sanitizeHTML(
                      barangay.name
                    )}
                  </option>
                `
              )
              .join('')}
          `;

          barangaySelect.disabled =
            false;
        }
      );
    }

    priorityFilterButtons.forEach(
      (button) => {
        button.addEventListener(
          'click',
          () => {
            selectedPriority =
              button.dataset
                .priorityFilter ?? '';

            priorityFilterButtons.forEach(
              (filterButton) => {
                filterButton.classList.remove(
                  'active'
                );
              }
            );

            button.classList.add(
              'active'
            );

            renderQueue();
          }
        );
      }
    );

    if (queueSearch) {
      queueSearch.addEventListener(
        'input',
        renderQueue
      );
    }

    if (ayudaForm) {
      ayudaForm.addEventListener(
        'submit',
        (e) => {
          e.preventDefault();

          const selectedProvince =
            provinces.find(
              (province) =>
                province.code ===
                provinceSelect.value
            );

          const selectedCity =
            citySelect
              ?.selectedOptions[0]
              ?.textContent
              .trim() ?? '';

          const selectedBarangay =
            barangaySelect
              ?.selectedOptions[0]
              ?.textContent
              .trim() ?? '';

          const citizen = {
            id: Date.now().toString(),

            name:
              nameInput.value.trim(),

            monthlyIncome:
              Number(
                monthlyIncomeInput.value
              ),

            isSenior:
              seniorInput.checked,

            isPWD:
              pwdInput.checked,

            dependentCount:
              Number(
                dependentInput.value ||
                  0
              ),

            provinceCode:
              provinceSelect.value,

            provinceName:
              selectedProvince?.name ??
              '',

            cityMunicipalityCode:
              citySelect.value,

            cityMunicipalityName:
              selectedCity,

            barangayCode:
              barangaySelect?.value ??
              '',

            barangayName:
              selectedBarangay
          };

          const result =
            evaluateAyudaEligibility(
              citizen
            );

          const application = {
            ...citizen,
            ...result
          };

          saveToOfflineQueue(
            application
          );

          refreshQueue();

          ayudaForm.reset();

          if (citySelect) {
            citySelect.innerHTML = `
              <option value="">
                Select City/Municipality...
              </option>
            `;

            citySelect.disabled =
              true;
          }

          if (barangaySelect) {
            barangaySelect.innerHTML = `
              <option value="">
                Select Barangay...
              </option>
            `;

            barangaySelect.disabled =
              true;
          }
        }
      );
    }

    if (addItemButton) {
      addItemButton.addEventListener(
        'click',
        () => {
          const name =
            itemNameInput.value.trim();

          const price =
            Number(
              itemPriceInput.value
            );

          if (
            !name ||
            !Number.isFinite(price) ||
            price <= 0
          ) {
            return;
          }

          const added =
            reliefPacker.addItem(
              name,
              price
            );

          if (!added) {
            console.warn(
              'Item exceeds the relief package budget.'
            );

            return;
          }

          itemNameInput.value = '';
          itemPriceInput.value = '';

          renderPOS();
        }
      );
    }

    setupActionDelegation(
      queueContainer,
      {
        'remove-resident': (
          button
        ) => {
          const id =
            button.dataset.id;

          removeFromOfflineQueue(
            id
          );

          refreshQueue();
        }
      }
    );

    setupActionDelegation(
      posContainer,
      {
        'remove-item': (
          button
        ) => {
          const index =
            Number(
              button.dataset.index
            );

          reliefPacker.removeItem(
            index
          );

          renderPOS();
        }
      }
    );
  }
);
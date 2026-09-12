import { createReliefPacker, evaluateAyudaEligibility } from './modules/engine.js';
import {
  renderPOSRegister,
  renderResidentCards,
  setupActionDelegation,
} from './modules/dom.js';
import {
  fetchCitiesMunicipalities,
  fetchProvinces,
  getOfflineQueue,
  removeFromOfflineQueue,
  saveToOfflineQueue,
} from './modules/async.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#ayuda-form');
  const provinceSelect = document.querySelector('#prov-select');
  const citySelect = document.querySelector('#city-select');
  const queueContainer = document.querySelector('#queue-container');
  const posContainer = document.querySelector('#pos-container');
  const itemName = document.querySelector('#item-name');
  const itemPrice = document.querySelector('#item-price');
  const addItemButton = document.querySelector('#add-item-btn');
  const packer = createReliefPacker();
  let offlineQueue = getOfflineQueue();

  const renderQueue = () => renderResidentCards(queueContainer, offlineQueue);
  const renderPOS = () => renderPOSRegister(posContainer, packer);

  const setOptions = (select, items, placeholder) => {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.code;
      option.textContent = item.name;
      select.append(option);
    });
  };

  renderQueue();
  renderPOS();

  fetchProvinces().then((provinces) => {
    setOptions(provinceSelect, provinces, 'Select Province...');
  });

  provinceSelect.addEventListener('change', async () => {
    citySelect.disabled = true;
    setOptions(citySelect, [], 'Loading cities...');
    const cities = await fetchCitiesMunicipalities(provinceSelect.value);
    setOptions(citySelect, cities, 'Select City/Municipality...');
    citySelect.disabled = false;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const province = provinceSelect.options[provinceSelect.selectedIndex]?.text || '';
    const city = citySelect.options[citySelect.selectedIndex]?.text || '';
    const assessment = evaluateAyudaEligibility({
      isSenior: document.querySelector('#is-senior').checked,
      isPWD: document.querySelector('#is-pwd').checked,
      monthlyIncome: document.querySelector('#monthly-income').value,
      dependentCount: document.querySelector('#dependent-count').value,
    });
    const application = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: document.querySelector('#name').value.trim(),
      province,
      city,
      ...assessment,
      createdAt: new Date().toISOString(),
    };

    offlineQueue = saveToOfflineQueue(application);
    renderQueue();
    form.reset();
    setOptions(citySelect, [], 'Select City/Municipality...');
  });

  addItemButton.addEventListener('click', () => {
    const result = packer.addItem(itemName.value, itemPrice.value);
    if (!result.success) {
      window.alert(result.reason);
      return;
    }
    itemName.value = '';
    itemPrice.value = '';
    renderPOS();
  });

  setupActionDelegation(document, {
    'remove-resident': (event, trigger) => {
      event.preventDefault();
      offlineQueue = removeFromOfflineQueue(trigger.dataset.id);
      renderQueue();
    },
    'remove-pos-item': (event, trigger) => {
      event.preventDefault();
      packer.removeItem(Number(trigger.dataset.index));
      renderPOS();
    },
  });
});
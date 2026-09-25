/**
 * [INTEGRATION] Main Entrypoint Module - Student Starter Template
 */



// TODO: Import required functions from engine.js, dom.js, and async.js
// TODO: Initialize DOM elements, load initial LocalStorage queue, fetch provinces, setup event listeners for form submission, cascading province/city dropdowns, POS packer, and action delegation.

import{evaluateAyudaEligibility, createReliefPacker} from './modules/engine.js';
import{sanitizeHTML, renderResidentCards, renderPOSRegister, setupActionDelegation} from './modules/dom.js';
import{fetchProvinces, fetchCitiesMunicipalities, getOfflineQueue, saveToOfflineQueue, removeFromOfflineQueue} from './modules/async.js';

async function provinces(){
  const provinces = await fetchProvinces();
  const provSelect = document.getElementById("prov-select");

  provinces.sort((a, b) => a.name.localeCompare(b.name));
  provSelect.innerHTML = `
        <option value="">Select Province...</option>
  `;

  provinces.forEach(province => {

    const option = document.createElement('option');
    option.value = province.code;
    option.textContent = province.name;

    provSelect.appendChild(option);
  });
}


async function CitiesMunicipalities(provinceCode) {
  const citiesMunicipalities = await fetchCitiesMunicipalities(provinceCode);
  const citySelect = document.getElementById("city-select");

  citiesMunicipalities.sort((a, b) => a.name.localeCompare(b.name));
  citySelect.innerHTML = `
        <option value="">Select City/Municipality...</option>
  `;

  citiesMunicipalities.forEach(city => {

    const option = document.createElement('option');
    option.value = city.code;
    option.textContent = city.name;

    citySelect.appendChild(option);
  });
}




document.addEventListener('DOMContentLoaded', () => {
console.log("e-Barangay Starter Kit Initialized. Happy Coding!");

provinces();
});

document.getElementById("prov-select").addEventListener('change', (e) => {
  CitiesMunicipalities(e.target.value);
});
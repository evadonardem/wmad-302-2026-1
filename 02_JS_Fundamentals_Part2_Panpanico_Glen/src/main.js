import { initRouteStatusMonitor } from './01_dom_tree_and_selection.js';
import { initSariSariPOS } from './02_events_and_delegation.js';
import { initResidentIdGenerator } from './03_forms_and_lifecycle.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('⚡ Episode 02 Vite App Initialized');
  initRouteStatusMonitor();
  initSariSariPOS();
  initResidentIdGenerator();
});
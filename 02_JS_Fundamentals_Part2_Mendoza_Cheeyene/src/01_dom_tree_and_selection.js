export function initRouteStatusMonitor() {
  const syncBtn = document.getElementById('btn-sync-routes');
  const routeList = document.querySelectorAll('#route-list li');
  const activeStat = document.getElementById('stat-active');
  const delayedStat = document.getElementById('stat-delayed');

  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
    // 1. Initialize counters
    let activeCount = 0;
    let delayedCount = 0;

    // 2. Loop through all route items
    routeList.forEach(item => {
      const status = item.dataset.status; // gets data-status="..."
      if (status === 'active') {
        activeCount++;
      } else if (status === 'delayed') {
        delayedCount++;
      }
    });

    // 3. Update the display
    activeStat.textContent = activeCount;
    delayedStat.textContent = delayedCount;
  });
}
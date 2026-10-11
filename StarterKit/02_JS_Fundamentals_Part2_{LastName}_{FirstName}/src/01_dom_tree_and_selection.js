export function initRouteStatusMonitor() {
  const syncBtn = document.getElementById('btn-sync-routes');
  const routeList = document.querySelectorAll('#route-list li');
  const activeStat = document.getElementById('stat-active');
  const delayedStat = document.getElementById('stat-delayed');

  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
    // TODO:
    // 1. Loop through routeList items
       let activeCount = 0;
    let delayedCount = 0;

    routeList.forEach(item => {
      const status = item.getAttribute('data-status');
    // 2. Count active (data-status="active") vs delayed items
      if (status === 'active') {
        activeCount++;
      } else if (status === 'delayed') {
        delayedCount++;
      }
    });
    // 3. Update activeStat and delayedStat text content
    activeStat.textContent = `Active Routes: ${activeCount}`;
    delayedStat.textContent = `Delayed/Full: ${delayedCount}`;
  });
}
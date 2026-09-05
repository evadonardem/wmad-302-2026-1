export function initRouteStatusMonitor() {
  const syncBtn = document.getElementById('btn-sync-routes');
  const routeList = document.querySelectorAll('#route-list li');
  const activeStat = document.getElementById('stat-active');
  const delayedStat = document.getElementById('stat-delayed');

  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
    // TODO:
    // 1. Loop through routeList items
    // 2. Count active (data-status="active") vs delayed items
    // 3. Update activeStat and delayedStat text content
    let activeCount = 0;
    let delayedCount = 0;

    routeList.forEach((someone) => {
      if (someone.getAttribute('data-status') === 'active') {
        activeCount++;
      } else {
        delayedCount++;
      }
    });

    activeStat.innerText = `Active Routes: ${activeCount}`;
    delayedStat.innerText = `Delayed Routes: ${delayedCount}`;
  });
}
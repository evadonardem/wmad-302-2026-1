export function initRouteStatusMonitor() {
  const syncBtn = document.getElementById('btn-sync-routes');
  const routeList = document.querySelectorAll('#route-list li');
  const activeStat = document.getElementById('stat-active');
  const delayedStat = document.getElementById('stat-delayed');

  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
    let activeCount = 0;
    let delayedCount = 0;

    routeList.forEach((route) => {
      if (route.dataset.status === 'active') {
        activeCount++;
    } else if (route.dataset.status === 'delayed') {
      delayedCount++;
    }
  });

  activeStat.textContent = `Active Routes: ${activeCount}`;
  delayedStat.textContent = `Delayed/Full: ${delayedCount}`;
  });
}
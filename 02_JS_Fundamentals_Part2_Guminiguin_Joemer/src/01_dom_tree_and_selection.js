export function initRouteStatusMonitor() {
  const syncBtn = document.getElementById('btn-sync-routes');
  const routeList = document.querySelectorAll('#route-list li');
  const activeStat = document.getElementById('stat-active');
  const delayedStat = document.getElementById('stat-delayed');

  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
    let activeCount = 0;
    let delayedCount = 0;

    routeList.forEach((li) => {
      const status = li.dataset.status;
      if (status === 'active') {
        activeCount++;
      } else if (status === 'delayed') {
        delayedCount++;
      }
    });

    if (activeStat) activeStat.textContent = `Active Routes: ${activeCount}`;
    if (delayedStat) delayedStat.textContent = `Delayed/Full: ${delayedCount}`;
  });
}
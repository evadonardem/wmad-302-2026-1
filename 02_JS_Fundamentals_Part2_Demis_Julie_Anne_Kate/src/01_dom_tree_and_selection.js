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
    let active = 0;
    let delayed = 0;

    routeList.forEach((item) => {
      if (item.dataset.status === 'active') active++;
      else if (item.dataset.status === 'delayed') delayed++;
    });

    activeStat.textContent = `Active Routes: ${active}`;
    delayedStat.textContent = `Delayed/Full: ${delayed}`;
  });
}
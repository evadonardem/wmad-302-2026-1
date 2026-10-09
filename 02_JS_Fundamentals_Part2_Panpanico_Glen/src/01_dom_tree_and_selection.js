export function initRouteStatusMonitor() {
  const syncBtn = document.getElementById('btn-sync-routes');
  const routeList = document.querySelectorAll('#route-list li');
  const activeStat = document.getElementById('stat-active');
  const delayedStat = document.getElementById('stat-delayed');

  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
      let active = 0;
    let delayed = 0;

    for (let i = 0; i < routeList.length; i++) {

      if (routeList[i].getAttribute('data-status') === 'active') {
        active++;
      }

      if (routeList[i].getAttribute('data-status') === 'delayed') {
        delayed++;
      }
    }

    activeStat.textContent = active;
    delayedStat.textContent = delayed;

  });
}
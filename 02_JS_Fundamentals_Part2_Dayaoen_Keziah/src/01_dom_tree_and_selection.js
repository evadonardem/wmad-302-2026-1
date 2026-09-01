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
    // Target span elements in your HTML
   
    let activeCount = 0;
    let delayedCount = 0;

    for (let i = 0; i < routeList.length; i++) {
      const route = routeList[i];
      const status = route.dataset.status;

      if (status === 'active') {
        activeCount++;
      } else if (status === 'delayed') {
        delayedCount++;
      }
    }

    activeStat.textContent ="Active Routes: " + activeCount;
    delayedStat.textContent = "Delayed/Full: " + delayedCount;
    
  
  });
}
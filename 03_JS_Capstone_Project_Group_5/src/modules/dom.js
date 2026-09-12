/**
 * [ROLE B] DOM & UI Module - Student Starter Template
 */

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function renderResidentCards(container, residents) {
  // TODO: Render resident cards into container. 
  // Handle empty state if residents array is empty.
  // Include data-action="remove-resident" and data-id attributes on delete buttons.

  if (residents.length === 0) {
    container.innerHTML = '<p>No residents in the queue.</p>';
    return;
  }

  container.innerHTML = residents.map((resident) => {

    // Calculate points for each criterion
    const seniorPoints = resident.isSenior === true ? 35 : 0;
    const pwdPoints = resident.isPWD === true ? 35 : 0;
    const incomePoints = resident.monthlyIncome < 10000 ? 20 : 0;

    const dependentCount = resident.dependentCount ?? 0;
    const dependentPoints = Math.min(dependentCount * 5, 20);

    // Maximum possible score
    const maxScore = 110;

    // Convert score to percentage for the score bar
    const scorePercentage = Math.min(
      (resident.score / maxScore) * 100,
      100
    );

    return `
      <div 
        class="resident-card" 
        data-priority="${sanitizeHTML(resident.priority)}"
      >

        <h3>${sanitizeHTML(resident.name)}</h3>

        <p>Priority: ${sanitizeHTML(resident.priority)}</p>

        <!-- Score / Health Bar -->
        <div class="score-section">

          <div class="score-header">
            <strong>Total Score</strong>
            <strong>${resident.score} / ${maxScore}</strong>
          </div>

          <div class="score-bar">
            <div 
              class="score-fill"
              style="width: ${scorePercentage}%"
            ></div>
          </div>

        </div>

        <!-- Explanation of Score -->
        <div class="score-breakdown">

          <div class="score-item">
            <span>Senior Citizen</span>
            <strong>+${seniorPoints}</strong>
          </div>

          <div class="score-item">
            <span>PWD</span>
            <strong>+${pwdPoints}</strong>
          </div>

          <div class="score-item">
            <span>Monthly Income</span>
            <strong>+${incomePoints}</strong>
          </div>

          <div class="score-item">
            <span>Dependents (${dependentCount})</span>
            <strong>+${dependentPoints}</strong>
          </div>

        </div>

        <!-- Remove Button Container -->
        <div class="resident-card-footer">

          <button 
            class="remove-resident-btn"
            data-action="remove-resident" 
            data-id="${sanitizeHTML(String(resident.id))}">
            Remove
          </button>

        </div>

      </div>
    `;
  }).join('');
}


/**
 * Render Queue Summary
 * Shows resident names only with a colored circle.
 * Order: CRITICAL → HIGH → LOW
 */
export function renderQueueSummary(container, residents) {

  if (residents.length === 0) {

    container.innerHTML = `
      <div class="summary-legend">

        <strong class="summary-legend-title">
          Priority Legend
        </strong>

        <div class="legend-items">

          <div class="legend-item">
            <span class="legend-dot critical"></span>
            <span>CRITICAL</span>
          </div>

          <div class="legend-item">
            <span class="legend-dot high"></span>
            <span>HIGH</span>
          </div>

          <div class="legend-item">
            <span class="legend-dot low"></span>
            <span>LOW</span>
          </div>

        </div>

      </div>

      <p>No residents registered.</p>
    `;

    return;
  }


  const priorityOrder = {
    CRITICAL: 1,
    HIGH: 2,
    LOW: 3
  };


  const sortedResidents =
    [...residents].sort((a, b) => {
      return (
        priorityOrder[a.priority] -
        priorityOrder[b.priority]
      );
    });


  container.innerHTML = `

    <!-- SUMMARY LEGEND -->
    <div class="summary-legend">

      <strong class="summary-legend-title">
        Priority Legend
      </strong>

      <div class="legend-items">

        <div class="legend-item">
          <span class="legend-dot critical"></span>
          <span>CRITICAL</span>
        </div>

        <div class="legend-item">
          <span class="legend-dot high"></span>
          <span>HIGH</span>
        </div>

        <div class="legend-item">
          <span class="legend-dot low"></span>
          <span>LOW</span>
        </div>

      </div>

    </div>


    <!-- SUMMARY RESIDENTS -->
    ${sortedResidents.map((resident) => `

      <div class="summary-resident">

        <span
          class="priority-dot"
          data-priority="${sanitizeHTML(
    resident.priority
  )}"
        ></span>

        <span class="summary-name">
          ${sanitizeHTML(resident.name)}
        </span>

      </div>

    `).join('')}

  `;
}

export function renderPOSRegister(container, packerState) {
  // TODO: Render POS register showing subtotal, budget cap, <progress> bar, and item list with remove buttons.

  const total = packerState.getTotal();
  const budgetCap = packerState.getBudgetCap();
  const items = packerState.getItems();
  const remaining = budgetCap - total;

  container.innerHTML = `
    <div class="pos-register">

      <p>Subtotal: ₱${total.toFixed(2)}</p>

      <p>Remaining Budget: ₱${remaining.toFixed(2)}</p>

      <progress 
        value="${total}" 
        max="${budgetCap}">
      </progress>

      <ul>
        ${items.map((item, index) => `
          <li>
            ${sanitizeHTML(item.name)} - ₱${item.price.toFixed(2)}

            <button 
              data-action="remove-item" 
              data-id="${index}">
              Remove
            </button>
          </li>
        `).join('')}
      </ul>

    </div>
  `;
}


export function setupActionDelegation(rootElement, actionMap) {
  // TODO: Implement event delegation on rootElement for elements with [data-action].

  rootElement.addEventListener('click', (e) => {

    const target = e.target.closest('[data-action]');

    if (!target) {
      return;
    }

    const action = target.dataset.action;
    const handler = actionMap[action];

    if (handler) {
      handler(target.dataset.id, e);
    }
  });
}


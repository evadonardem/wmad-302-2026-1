export function sanitizeHTML(str) {
  const temp = document.createElement('div');

  temp.textContent = String(str ?? '');

  return temp.innerHTML;
}

function getSurname(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  return parts[parts.length - 1];
}

function formatResidentName(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return parts.join('');
  }

  const surname = parts[parts.length - 1];

  const givenNames = parts
    .slice(0, -1)
    .join(' ');

  return `${surname}, ${givenNames}`;
}

function sortResidentsBySurname(residents) {
  return [...residents].sort((a, b) => {
    const surnameA =
      getSurname(a.name).toLowerCase();

    const surnameB =
      getSurname(b.name).toLowerCase();

    const surnameComparison =
      surnameA.localeCompare(
        surnameB,
        undefined,
        {
          sensitivity: 'base'
        }
      );

    if (surnameComparison !== 0) {
      return surnameComparison;
    }

    return String(a.name ?? '').localeCompare(
      String(b.name ?? ''),
      undefined,
      {
        sensitivity: 'base'
      }
    );
  });
}

export function renderResidentCards(
  container,
  residents
) {
  if (!container) return;

  if (
    !residents ||
    residents.length === 0
  ) {
    container.innerHTML =
      '<p class="empty-state">No resident applications found.</p>';

    return;
  }

  const priorityOrder = [
    'CRITICAL',
    'HIGH',
    'LOW'
  ];

  const groupedResidents = {
    CRITICAL: [],
    HIGH: [],
    LOW: []
  };

  residents.forEach((resident) => {
    const priority =
      String(
        resident.priority ?? 'LOW'
      ).toUpperCase();

    if (
      groupedResidents[priority]
    ) {
      groupedResidents[priority].push(
        resident
      );
    }
  });

  let html = '';

  priorityOrder.forEach((priority) => {
    const group =
      sortResidentsBySurname(
        groupedResidents[priority]
      );

    if (group.length === 0) {
      return;
    }

    html += `
      <section
        class="queue-priority-section"
        data-priority="${priority}"
      >
        <div class="priority-title">
          <span>${priority}</span>

          <span class="priority-count">
            ${group.length}
          </span>
        </div>

        <div class="priority-residents">
          ${group
            .map((resident) => {
              const safePriority =
                sanitizeHTML(
                  String(
                    resident.priority ??
                      priority
                  )
                );

              const rawName =
                String(
                  resident.name ?? ''
                ).trim();

              const displayName =
                formatResidentName(
                  rawName
                );

              const safeName =
                sanitizeHTML(
                  displayName
                );

              const safeScore =
                sanitizeHTML(
                  String(
                    resident.score ?? 0
                  )
                );

              const safeId =
                sanitizeHTML(
                  String(
                    resident.id ?? ''
                  )
                );

              const province =
                sanitizeHTML(
                  resident.provinceName ??
                    resident.provinceCode ??
                    'N/A'
                );

              const city =
                sanitizeHTML(
                  resident.cityMunicipalityName ??
                    resident.cityMunicipalityCode ??
                    'N/A'
                );

              const barangay =
                sanitizeHTML(
                  resident.barangayName ??
                    resident.barangayCode ??
                    ''
                );

              return `
                <article
                  class="resident-card"
                  data-priority="${safePriority}"
                  data-province="${sanitizeHTML(
                    resident.provinceCode ?? ''
                  )}"
                  data-city="${sanitizeHTML(
                    resident.cityMunicipalityCode ?? ''
                  )}"
                  data-barangay="${sanitizeHTML(
                    resident.barangayCode ?? ''
                  )}"
                >
                  <div class="resident-info">

                    <div class="resident-title-row">
                      <h3>${safeName}</h3>

                      <span class="badge ${safePriority.toLowerCase()}">
                        ${safePriority}
                      </span>
                    </div>

                    <p>
                      <strong>Score:</strong>
                      ${safeScore}
                    </p>

                    <p>
                      <strong>Status:</strong>
                      ${
                        resident.approved
                          ? 'Approved'
                          : 'Not Approved'
                      }
                    </p>

                    <p class="resident-location">
                      <strong>Province:</strong>
                      ${province}
                    </p>

                    <p class="resident-location">
                      <strong>City / Municipality:</strong>
                      ${city}
                    </p>

                    ${
                      barangay
                        ? `
                          <p class="resident-location">
                            <strong>Barangay:</strong>
                            ${barangay}
                          </p>
                        `
                        : ''
                    }

                  </div>

                  <button
                    type="button"
                    class="btn-danger"
                    data-action="remove-resident"
                    data-id="${safeId}"
                  >
                    Remove
                  </button>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  });

  container.innerHTML = html;
}

export function renderPOSRegister(
  container,
  packerState
) {
  if (
    !container ||
    !packerState
  ) {
    return;
  }

  const items =
    packerState.getItems();

  const total =
    Number(
      packerState.getTotal()
    );

  const budgetCap =
    Number(
      packerState.getBudgetCap()
    );

  const remaining =
    Math.max(
      0,
      budgetCap - total
    );

  const progress =
    budgetCap > 0
      ? Math.min(
          100,
          (total / budgetCap) * 100
        )
      : 0;

  container.innerHTML = `
    <div class="pos-summary">

      <p>
        <strong>Subtotal:</strong>
        ₱${total.toFixed(2)}
      </p>

      <p>
        <strong>Budget Cap:</strong>
        ₱${budgetCap.toFixed(2)}
      </p>

      <p>
        <strong>Remaining Budget:</strong>
        ₱${remaining.toFixed(2)}
      </p>

      <progress
        value="${total}"
        max="${budgetCap}"
      ></progress>

      <span>
        ${progress.toFixed(0)}% used
      </span>

    </div>

    <div class="pos-items">

      ${
        items.length === 0
          ? `
            <p class="empty-state">
              No items added.
            </p>
          `
          : items
              .map(
                (item, index) => `
                  <div class="pos-item">

                    <span>
                      ${sanitizeHTML(
                        item.name
                      )}
                    </span>

                    <span>
                      ₱${Number(
                        item.price
                      ).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      data-action="remove-item"
                      data-index="${index}"
                    >
                      Remove
                    </button>

                  </div>
                `
              )
              .join('')
      }

    </div>
  `;
}

export function setupActionDelegation(
  rootElement,
  actionMap
) {
  if (!rootElement) return;

  rootElement.addEventListener(
    'click',
    (e) => {
      const target =
        e.target.closest(
          '[data-action]'
        );

      if (
        !target ||
        !rootElement.contains(target)
      ) {
        return;
      }

      const action =
        target.dataset.action;

      const handler =
        actionMap[action];

      if (
        typeof handler === 'function'
      ) {
        handler(target, e);
      }
    }
  );
}
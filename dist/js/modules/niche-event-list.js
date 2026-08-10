/**
 * Niche Event List Module
 * Renders the full event list for a niche with expand/collapse.
 */

import { loadNicheConfig } from './data-loader.js';

/**
 * Escape HTML to prevent XSS.
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get niche config by ID.
 */
function getNicheConfigById(nicheId, config) {
  return config.niches.find((n) => n.id === nicheId) || null;
}

/**
 * Build a single event card HTML.
 */
function buildEventCardHtml(event, nicheConfig) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';

  const niches = (event.niches || []).slice(0, 3);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheConfigById(nicheId, nicheConfig);
      const name = info ? info.name : nicheId;
      const icon = info ? info.icon : '📅';
      return `<span class="badge badge-brand badge-sm">${icon} ${escapeHtml(name)}</span>`;
    })
    .join(' ');

  const imageBlock = imageUrl
    ? `<div class="event-card__image"><img src="${imageUrl}" alt="" loading="lazy" width="400" height="225"></div>`
    : '';

  return `
    <article class="event-card">
      <span class="event-card__year">${year}</span>
      <div class="event-card__content">
        <p class="event-card__description">${description}</p>
        <div class="event-card__footer">${badgesHtml}</div>
      </div>
      ${imageBlock}
    </article>`;
}

/**
 * Build the "Show All" / "Show Less" button HTML.
 */
function buildExpandButton(visibleCount, totalCount, isExpanded) {
  if (totalCount <= 5) return '';

  if (isExpanded) {
    return `
      <div style="text-align: center; margin-top: var(--space-4);">
        <button class="btn btn-outline btn-sm" id="toggle-event-list">
          Show Less
        </button>
      </div>`;
  }

  const remaining = totalCount - visibleCount;
  return `
    <div style="text-align: center; margin-top: var(--space-4);">
      <button class="btn btn-outline btn-sm" id="toggle-event-list">
        Show All ${totalCount} Events (${remaining} more)
      </button>
    </div>`;
}

/**
 * Render the niche event list with expand/collapse.
 */
export async function renderNicheEventList(nicheEvents, containerId = 'niche-events-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const section = document.getElementById('niche-events-section');
  if (!section) return;

  // Hide section if no events beyond the hero
  if (nicheEvents.length <= 1) {
    section.style.display = 'none';
    return;
  }

  const nicheConfig = await loadNicheConfig();
  const events = nicheEvents.slice(1, 20); // Skip hero event
  const INITIAL_DISPLAY = 5;
  const totalEvents = events.length;
  let isExpanded = false;

  if (totalEvents === 0) {
    section.style.display = 'none';
    return;
  }

  /**
   * Render cards based on current expand state.
   */
  function renderCards() {
    const visibleEvents = isExpanded ? events : events.slice(0, INITIAL_DISPLAY);

    const cardsHtml = visibleEvents.map((event) => buildEventCardHtml(event, nicheConfig)).join('');

    const buttonHtml = buildExpandButton(
      Math.min(INITIAL_DISPLAY, totalEvents),
      totalEvents,
      isExpanded
    );

    container.innerHTML = cardsHtml + buttonHtml;

    // Re-attach click handler to the new button
    const toggleButton = document.getElementById('toggle-event-list');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        isExpanded = !isExpanded;
        renderCards();

        // Smooth scroll to the button if collapsing
        if (!isExpanded) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  // Initial render
  renderCards();
}

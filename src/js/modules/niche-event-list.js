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
  function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';

  // Extract a short title from the description
  const titleBreakPoints = [',', ';', ' – ', ' - ', '. ', ': '];
  let title = description;
  for (const point of titleBreakPoints) {
    const index = description.indexOf(point);
    if (index > 10 && index < 80) {
      title = description.substring(0, index);
      break;
    }
  }
  if (title === description && title.length > 60) {
    title = title.substring(0, 60) + '...';
  }

  // Check if description needs truncation
  const needsTruncation = description.length > 120;
  const shortDesc = needsTruncation ? description.substring(0, 120) + '...' : description;

  // Build niche badges (max 2)
  const niches = (event.niches || []).slice(0, 2);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheConfigById(nicheId, nicheConfig);
      const name = info ? info.name : nicheId;
      const icon = info ? info.icon : '📅';
      return `<span class="badge badge-brand badge-sm">${icon} ${name}</span>`;
    })
    .join(' ');

  // Image block with fallback
  const imageBlock = imageUrl
    ? `<div class="event-card__image"><img src="${imageUrl}" alt="" loading="lazy" width="400" height="225"></div>`
    : `<div class="event-card__image" style="background: linear-gradient(135deg, var(--color-brand-100), var(--color-brand-200)); display: flex; align-items: center; justify-content: center; font-size: 2rem;">📅</div>`;

  // More/less button if needed
  const moreButton = needsTruncation
    ? `<button class="event-card__more-btn" data-full="${escapeAttr(description)}" data-short="${escapeAttr(shortDesc)}">Show more</button>`
    : '';

  return `
    <article class="event-card event-card--grid">
      ${imageBlock}
      <div class="event-card__body">
        <span class="event-card__year">${year}</span>
        <h3 class="event-card__title">${escapeHtml(title)}</h3>
        <p class="event-card__description" data-full="${escapeAttr(description)}">${shortDesc}</p>
        ${moreButton}
        <div class="event-card__footer">
          ${badgesHtml}
        </div>
      </div>
    </article>
  `;
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

function attachMoreButtonHandlers(container) {
  container.querySelectorAll('.event-card__more-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const descriptionEl = button.previousElementSibling;
      const fullText = descriptionEl.dataset.full;
      const shortText = button.dataset.short;
      const isExpanded = button.textContent === 'Show less';

      if (isExpanded) {
        descriptionEl.textContent = shortText;
        button.textContent = 'Show more';
      } else {
        descriptionEl.textContent = fullText;
        button.textContent = 'Show less';
      }
    });
  });
}

/**
 * Render the niche event list with expand/collapse.
 */
export async function renderNicheEventList(nicheEvents, containerId = 'niche-events-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.className = 'event-cards-grid';

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
    attachMoreButtonHandlers(container);

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

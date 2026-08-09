/**
 * Timeline Builder Module
 * Renders the top 20 events (excluding the hero) as a scrollable list.
 */

import { loadEvents, loadNicheConfig } from './data-loader.js';

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
 * Get niche display info from config.
 */
function getNicheInfo(nicheId, config) {
  const niche = config.niches.find((n) => n.id === nicheId);
  return {
    name: niche ? niche.name : nicheId,
    icon: niche ? niche.icon : '📅',
  };
}

/**
 * Build HTML for a single event card.
 */
function buildEventCardHtml(event, nicheConfig) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';

  // Create a short title from the first 60 chars of description
  const title = description.length > 60 ? description.substring(0, 60) + '...' : description;

  // Build niche badges (max 2)
  const niches = (event.niches || []).slice(0, 2);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheInfo(nicheId, nicheConfig);
      return `<span class="badge badge-brand badge-sm">${info.icon} ${info.name}</span>`;
    })
    .join(' ');

  // Image block with fallback
  const imageBlock = imageUrl
    ? `<div class="event-card__image"><img src="${imageUrl}" alt="" loading="lazy"></div>`
    : `<div class="event-card__image" style="background: linear-gradient(135deg, var(--color-brand-100), var(--color-brand-200)); display: flex; align-items: center; justify-content: center; font-size: 2rem;">📅</div>`;

  return `
    <article class="event-card event-card--grid">
      ${imageBlock}
      <div class="event-card__body">
        <span class="event-card__year">${year}</span>
        <h3 class="event-card__title">${escapeHtml(title)}</h3>
        <p class="event-card__description">${description}</p>
        <div class="event-card__footer">
          ${badgesHtml}
        </div>
      </div>
    </article>
  `;
}

/**
 * Render the timeline with events #2 through #20.
 */
export async function renderTimeline(containerId = 'timeline-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.className = 'event-cards-grid';

  try {
    const [eventsData, nicheConfig] = await Promise.all([loadEvents(), loadNicheConfig()]);

    const events = eventsData.events || [];

    if (events.length === 0) {
      container.innerHTML = '<p>No events found for today.</p>';
      return;
    }

    // Skip the first event (it's the hero), take the next 19
    const timelineEvents = events.slice(1, 20);

    if (timelineEvents.length === 0) {
      container.innerHTML = '<p>No additional events for today.</p>';
      return;
    }

    const cardsHtml = timelineEvents
      .map((event) => buildEventCardHtml(event, nicheConfig))
      .join('');

    container.innerHTML = cardsHtml;
  } catch (error) {
    console.error('Error rendering timeline:', error);
    container.innerHTML = '<p>Failed to load events.</p>';
  }
}

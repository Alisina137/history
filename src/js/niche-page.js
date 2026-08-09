/**
 * Niche Page — Entry Point
 * Reads niche ID from URL and renders the niche page.
 */

import { renderNicheHero } from './modules/niche-hero-builder.js';
import { initFavoriteButtons } from './modules/favorites-manager.js';
import { loadNicheConfig } from './modules/data-loader.js';

/**
 * Extract niche ID from the URL.
 */
function getNicheIdFromUrl() {
  const path = window.location.pathname;

  const staticMatch = path.match(/\/niche\/(.+)\.html$/);
  if (staticMatch) {
    return staticMatch[1];
  }

  const params = new URLSearchParams(window.location.search);
  const queryNiche = params.get('niche');
  if (queryNiche) {
    return queryNiche;
  }

  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'niche') {
    return parts[1].replace('.html', '');
  }

  return null;
}

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
 * Build event card HTML (non-hero).
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
      return `<span class="badge badge-brand badge-sm">${icon} ${name}</span>`;
    })
    .join(' ');

  const imageBlock = imageUrl
    ? `<div class="event-card__image"><img src="${imageUrl}" alt="" loading="lazy"></div>`
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
 * Render the full niche page.
 */
async function renderNichePage() {
  const nicheId = getNicheIdFromUrl();

  if (!nicheId) {
    document.body.innerHTML =
      '<main class="container"><section class="section"><p>No niche specified. <a href="/">Go home</a>.</p></section></main>';
    return;
  }

  // Render hero (returns niche events data we need for the list)
  const result = await renderNicheHero(nicheId);
  if (!result) return;

  const { nicheEvents, nicheConfig } = result;

  // Render event list (events 2-20)
  const eventsContainer = document.getElementById('niche-events-container');
  const remainingEvents = nicheEvents.slice(1, 20);

  if (remainingEvents.length > 0) {
    const cardsHtml = remainingEvents
      .map((event) => buildEventCardHtml(event, nicheConfig))
      .join('');
    eventsContainer.innerHTML = cardsHtml;
  } else if (nicheEvents.length <= 1) {
    document.getElementById('niche-events-section').style.display = 'none';
  } else {
    eventsContainer.innerHTML = '<p>No additional events today.</p>';
  }

  // Initialize favorites
  initFavoriteButtons();
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNichePage);
} else {
  renderNichePage();
}

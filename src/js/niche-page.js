/**
 * Niche Page — Entry Point
 * Reads niche ID from URL and renders the niche page.
 */

import { loadEvents, loadNicheConfig } from './modules/data-loader.js';
import { initFavoriteButtons } from './modules/favorites-manager.js';

/**
 * Extract niche ID from the URL.
 * Works for both:
 *   - /niche/space-exploration.html (static build)
 *   - /niche.html?niche=space-exploration (dev server)
 */
function getNicheIdFromUrl() {
  const path = window.location.pathname;

  // Static build: /niche/space-exploration.html
  const staticMatch = path.match(/\/niche\/(.+)\.html$/);
  if (staticMatch) {
    return staticMatch[1];
  }

  // Dev server: /niche.html?niche=space-exploration
  const params = new URLSearchParams(window.location.search);
  const queryNiche = params.get('niche');
  if (queryNiche) {
    return queryNiche;
  }

  // Fallback: try to extract from path
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
 * Build event card HTML.
 */
function buildEventCardHtml(event, nicheConfig, isHero = false) {
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

  if (isHero) {
    const bgStyle = imageUrl
      ? `style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"`
      : 'style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);"';

    return `
    <article class="event-card event-card--hero">
      <div class="event-card__image" ${bgStyle}>
        <div class="hero-overlay"></div>
      </div>
      <div class="event-card__body">
        <span class="event-card__year">${year}</span>
        <p class="event-card__description">${description}</p>
        <div class="event-card__footer">${badgesHtml}</div>
      </div>
    </article>`;
  }

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
      '<main class="container"><p>No niche specified. <a href="/">Go home</a>.</p></main>';
    return;
  }

  try {
    const [eventsData, nicheConfig] = await Promise.all([loadEvents(), loadNicheConfig()]);

    const nicheInfo = getNicheConfigById(nicheId, nicheConfig);
    const nicheEvents =
      eventsData.niches && eventsData.niches[nicheId] ? eventsData.niches[nicheId] : [];

    // Update page title
    const nicheName = nicheInfo ? nicheInfo.name : nicheId.replace(/-/g, ' ');
    const nicheIcon = nicheInfo ? nicheInfo.icon : '📅';
    document.title = `${nicheName} — Today in History`;

    // Render niche header
    const headerContainer = document.getElementById('niche-header-container');
    headerContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="font-size: 2rem;">${nicheIcon}</span>
        <h1 style="margin: 0;">${escapeHtml(nicheName)}</h1>
        <button class="niche-card__favorite ${isNicheFavorited(nicheId) ? 'niche-card__favorite--active' : ''}"
                data-niche="${escapeHtml(nicheId)}"
                style="position: static; margin-left: auto;"
                aria-label="Toggle favorite">
          ${isNicheFavorited(nicheId) ? '♥' : '♡'}
        </button>
      </div>
      <p class="section__subtitle">${nicheEvents.length} events today in ${escapeHtml(nicheName)}.</p>
    `;

    // Render hero (first event)
    const heroContainer = document.getElementById('niche-hero-container');
    if (nicheEvents.length > 0) {
      heroContainer.innerHTML = buildEventCardHtml(nicheEvents[0], nicheConfig, true);
    } else {
      heroContainer.innerHTML = '<p>No events today for this niche. Check back tomorrow!</p>';
    }

    // Render event list (events 2-20)
    const eventsContainer = document.getElementById('niche-events-container');
    const remainingEvents = nicheEvents.slice(1, 20);
    if (remainingEvents.length > 0) {
      const cardsHtml = remainingEvents
        .map((event) => buildEventCardHtml(event, nicheConfig, false))
        .join('');
      eventsContainer.innerHTML = cardsHtml;
    } else if (nicheEvents.length <= 1) {
      document.getElementById('niche-events-section').style.display = 'none';
    }

    // Initialize favorites
    initFavoriteButtons();
  } catch (error) {
    console.error('Error rendering niche page:', error);
    document.getElementById('niche-header-container').innerHTML =
      '<p>Failed to load niche. <a href="/">Go home</a>.</p>';
  }
}

/**
 * Check localStorage for favorite status.
 */
function isNicheFavorited(nicheId) {
  try {
    const favorites = JSON.parse(localStorage.getItem('favoriteNiches') || '[]');
    return favorites.includes(nicheId);
  } catch {
    return false;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNichePage);
} else {
  renderNichePage();
}

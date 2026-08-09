/**
 * Niche Grid Builder Module
 * Renders all 30 niche cards with teasers and event counts.
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
 * Build HTML for a single niche card.
 */
function buildNicheCardHtml(nicheId, nicheConfig, summary) {
  const niche = nicheConfig.niches.find((n) => n.id === nicheId);

  // Default values if niche not found in config
  const name = niche ? niche.name : nicheId.replace(/-/g, ' ');
  const icon = niche ? niche.icon : '📅';
  const count = summary ? summary.count : 0;
  const topEvent = summary ? summary.top_event : null;

  // Teaser text
  let teaser = 'No events today for this niche.';
  if (topEvent) {
    const desc = escapeHtml(topEvent.description);
    teaser = desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
  }

  // Background image from top event
  const bgImage = topEvent && topEvent.image_url ? topEvent.image_url : '';
  const bgStyle = bgImage
    ? `style="background-image: url('${bgImage}'); background-size: cover; background-position: center; opacity: 0.15;"`
    : 'style="background: linear-gradient(135deg, #3b82f6, #60a5fa); opacity: 0.1;"';

  // Check if this niche is favorited
  const isFavorited = isNicheFavorited(nicheId);
  const heartClass = isFavorited ? 'niche-card__favorite--active' : '';
  const heartIcon = isFavorited ? '♥' : '♡';

  return `
    <div class="niche-card" data-niche="${escapeHtml(nicheId)}">
      <div class="niche-card__bg" ${bgStyle}></div>
      <div class="niche-card__content">
        <div>
          <div class="niche-card__icon">${icon}</div>
          <h4 class="niche-card__title">${escapeHtml(name)}</h4>
          <p class="niche-card__teaser">${teaser}</p>
        </div>
        <div class="niche-card__footer">
          <span class="niche-card__count">+${count} events</span>
          <button class="niche-card__favorite ${heartClass}" 
                  data-niche="${escapeHtml(nicheId)}" 
                  aria-label="${isFavorited ? 'Remove from' : 'Add to'} favorites">
            ${heartIcon}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Check if a niche is in the user's favorites.
 */
function isNicheFavorited(nicheId) {
  try {
    const favorites = JSON.parse(localStorage.getItem('favoriteNiches') || '[]');
    return favorites.includes(nicheId);
  } catch {
    return false;
  }
}

/**
 * Get niche summaries from events data.
 * Groups events by niche and calculates count + top event per niche.
 */
function buildNicheSummaries(eventsData) {
  const nicheGroups = eventsData.niches || {};
  const summaries = {};

  for (const [nicheId, events] of Object.entries(nicheGroups)) {
    summaries[nicheId] = {
      count: events.length,
      top_event:
        events.length > 0
          ? {
              description: events[0].description,
              image_url: events[0].image_url || '',
              year: events[0].year,
            }
          : null,
    };
  }

  return summaries;
}

/**
 * Render the niche card grid.
 */
export async function renderNicheGrid(containerId = 'niche-grid-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const [eventsData, nicheConfig] = await Promise.all([loadEvents(), loadNicheConfig()]);

    const allNiches = nicheConfig.niches || [];

    if (allNiches.length === 0) {
      container.innerHTML = '<p>No niches configured.</p>';
      return;
    }

    // Build summaries from events data
    const summaries = buildNicheSummaries(eventsData);

    // Render all 30 niche cards
    const cardsHtml = allNiches
      .map((niche) => {
        const summary = summaries[niche.id] || { count: 0, top_event: null };
        return buildNicheCardHtml(niche.id, nicheConfig, summary);
      })
      .join('');

    container.innerHTML = cardsHtml;

    // Attach click handlers to cards (navigate to niche page)
    attachNicheCardHandlers();
  } catch (error) {
    console.error('Error rendering niche grid:', error);
    container.innerHTML = '<p>Failed to load niches.</p>';
  }
}

/**
 * Attach click handlers to niche cards.
 * Clicking a card navigates to the niche page.
 * Clicking the favorite button toggles favorite status.
 */
function attachNicheCardHandlers() {
  document.querySelectorAll('.niche-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      // Don't navigate if the favorite button was clicked
      if (event.target.closest('.niche-card__favorite')) {
        return;
      }

      const nicheId = card.dataset.niche;
      if (nicheId) {
        window.location.href = `/niche/${nicheId}.html`;
      }
    });
  });

  // Favorite button handlers (basic toggle for now, full logic in Task 5.5)
  document.querySelectorAll('.niche-card__favorite').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      // Will be fully implemented in Task 5.5
      console.log('Favorite toggled:', button.dataset.niche);
    });
  });
}

/**
 * Related Niches Module
 * Shows related niche cards based on the current niche.
 */

import { loadEvents, loadNicheConfig } from './data-loader.js';
import { isFavorited } from './favorites-manager.js';

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
 * Niche relationship map.
 * Each niche links to 3-5 related niches.
 */
const RELATED_MAP = {
  'space-exploration': [
    'inventions-technology',
    'physics-mathematics',
    'firsts-in-history',
    'explorers-adventurers',
  ],
  'inventions-technology': [
    'space-exploration',
    'physics-mathematics',
    'business-economics',
    'firsts-in-history',
  ],
  'physics-mathematics': ['space-exploration', 'inventions-technology', 'firsts-in-history'],
  'music-history': ['cinema-film', 'art-architecture', 'literature-writers'],
  'cinema-film': ['music-history', 'literature-writers', 'art-architecture', 'fashion-design'],
  'literature-writers': ['cinema-film', 'art-architecture', 'music-history', 'religion-philosophy'],
  'art-architecture': ['cinema-film', 'literature-writers', 'fashion-design', 'empires-dynasties'],
  'wars-battles': ['politics-revolutions', 'empires-dynasties', 'espionage-secrets', 'true-crime'],
  'politics-revolutions': ['wars-battles', 'empires-dynasties', 'civil-rights-justice'],
  'empires-dynasties': [
    'wars-battles',
    'politics-revolutions',
    'royalty-nobility',
    'archaeology-discoveries',
  ],
  'true-crime': ['espionage-secrets', 'wars-battles', 'strange-unexplained'],
  'sports-history': ['firsts-in-history', 'explorers-adventurers', 'medicine-health'],
  'medicine-health': ['inventions-technology', 'natural-disasters', 'firsts-in-history'],
  'women-in-history': ['civil-rights-justice', 'politics-revolutions', 'literature-writers'],
  'civil-rights-justice': ['politics-revolutions', 'women-in-history', 'wars-battles'],
  'business-economics': ['inventions-technology', 'politics-revolutions', 'transportation'],
  'natural-disasters': ['climate-weather', 'medicine-health', 'explorers-adventurers'],
  'archaeology-discoveries': ['empires-dynasties', 'explorers-adventurers', 'strange-unexplained'],
  'explorers-adventurers': ['archaeology-discoveries', 'space-exploration', 'transportation'],
  'royalty-nobility': ['empires-dynasties', 'fashion-design', 'art-architecture'],
  'espionage-secrets': ['wars-battles', 'true-crime', 'politics-revolutions'],
  'fashion-design': ['art-architecture', 'cinema-film', 'royalty-nobility'],
  'climate-weather': ['natural-disasters', 'explorers-adventurers', 'animal-wildlife'],
  'animal-wildlife': ['climate-weather', 'natural-disasters', 'explorers-adventurers'],
  'food-drink': ['business-economics', 'inventions-technology', 'strange-unexplained'],
  'religion-philosophy': ['empires-dynasties', 'literature-writers', 'politics-revolutions'],
  transportation: ['inventions-technology', 'business-economics', 'explorers-adventurers'],
  'strange-unexplained': ['true-crime', 'hoaxes-deceptions', 'archaeology-discoveries'],
  'hoaxes-deceptions': ['strange-unexplained', 'true-crime', 'espionage-secrets'],
  'firsts-in-history': ['space-exploration', 'inventions-technology', 'explorers-adventurers'],
};

/**
 * Build a related niche card HTML (compact version).
 */
function buildRelatedNicheCardHtml(nicheId, nicheConfig, summary) {
  const niche = nicheConfig.niches.find((n) => n.id === nicheId);
  if (!niche) return '';

  const name = niche.name;
  const icon = niche.icon;
  const count = summary ? summary.count : 0;

  const topEvent = summary && summary.top_event ? summary.top_event : null;
  const bgImage = topEvent && topEvent.image_url ? topEvent.image_url : '';

  const bgStyle = bgImage
    ? `style="background-image: url('${bgImage}'); background-size: cover; background-position: center; opacity: 0.1;"`
    : 'style="background: linear-gradient(135deg, #3b82f6, #60a5fa); opacity: 0.1;"';

  const favorited = isFavorited(nicheId);

  return `
    <div class="niche-card" data-niche="${escapeHtml(nicheId)}" style="min-height: 140px;">
      <div class="niche-card__bg" ${bgStyle}></div>
      <div class="niche-card__content">
        <div>
          <div class="niche-card__icon">${icon}</div>
          <h4 class="niche-card__title">${escapeHtml(name)}</h4>
        </div>
        <div class="niche-card__footer">
          <span class="niche-card__count">+${count} events</span>
          <button class="niche-card__favorite ${favorited ? 'niche-card__favorite--active' : ''}"
                  data-niche="${escapeHtml(nicheId)}"
                  aria-label="${favorited ? 'Remove from' : 'Add to'} favorites">
            ${favorited ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build niche summaries from events data.
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
            }
          : null,
    };
  }

  return summaries;
}

/**
 * Render related niches for the current niche.
 */
export async function renderRelatedNiches(
  currentNicheId,
  containerId = 'related-niches-container'
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const relatedIds = RELATED_MAP[currentNicheId];

  if (!relatedIds || relatedIds.length === 0) {
    document.getElementById('related-niches-section').style.display = 'none';
    return;
  }

  try {
    const [eventsData, nicheConfig] = await Promise.all([loadEvents(), loadNicheConfig()]);

    const summaries = buildNicheSummaries(eventsData);

    const cardsHtml = relatedIds
      .map((nicheId) => {
        const summary = summaries[nicheId] || { count: 0, top_event: null };
        return buildRelatedNicheCardHtml(nicheId, nicheConfig, summary);
      })
      .filter(Boolean)
      .join('');

    container.innerHTML = cardsHtml;

    // Attach click handlers
    container.querySelectorAll('.niche-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.niche-card__favorite')) return;
        const nicheId = card.dataset.niche;
        if (nicheId) {
          const isLocal =
            window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
          if (isLocal) {
            window.location.href = `/niche.html?niche=${nicheId}`;
          } else {
            window.location.href = `/niche/${nicheId}.html`;
          }
        }
      });
    });
  } catch (error) {
    console.error('Error rendering related niches:', error);
    document.getElementById('related-niches-section').style.display = 'none';
  }
}

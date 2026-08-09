/**
 * Hero Builder Module
 * Renders the #1 event as a full-width hero section.
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
 * Get niche display info (name, icon) from config.
 */
function getNicheInfo(nicheId, config) {
  const niche = config.niches.find((n) => n.id === nicheId);
  return {
    name: niche ? niche.name : nicheId,
    icon: niche ? niche.icon : '📅',
  };
}

/**
 * Build the hero HTML for a given event.
 */
function buildHeroHtml(event, nicheConfig) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || event.hero_image_url || '';

  // Build niche badges
  const niches = (event.niches || []).slice(0, 3);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheInfo(nicheId, nicheConfig);
      return `<span class="badge badge-brand">${info.icon} ${info.name}</span>`;
    })
    .join(' ');

  // Background style
  const bgStyle = imageUrl
    ? `style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"`
    : 'style="background: linear-gradient(135deg, #1e3a8a, #3b82f6, #60a5fa);"';

  return `
    <article class="event-card event-card--hero">
      <div class="event-card__image" ${bgStyle}>
        <div class="hero-overlay"></div>
      </div>
      <div class="event-card__body">
        <span class="event-card__year">${year}</span>
        <p class="event-card__description">${description}</p>
        <div class="event-card__footer">
          ${badgesHtml}
        </div>
      </div>
    </article>
  `;
}

/**
 * Render the hero section with the #1 event.
 */
export async function renderHero(containerId = 'hero-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const [eventsData, nicheConfig] = await Promise.all([loadEvents(), loadNicheConfig()]);

    const events = eventsData.events || [];

    if (events.length === 0) {
      container.innerHTML = '<p>No events found for today.</p>';
      return;
    }

    const topEvent = events[0];
    const heroHtml = buildHeroHtml(topEvent, nicheConfig);
    container.innerHTML = heroHtml;
  } catch (error) {
    console.error('Error rendering hero:', error);
    container.innerHTML = "<p>Failed to load today's top event.</p>";
  }
}

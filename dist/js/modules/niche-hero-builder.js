/**
 * Niche Hero Builder Module
 * Renders the niche header and hero event for a niche page.
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
 * Get niche config by ID.
 */
function getNicheConfigById(nicheId, config) {
  return config.niches.find((n) => n.id === nicheId) || null;
}

/**
 * Build the niche header HTML (icon, name, count, favorite button).
 */
function buildNicheHeaderHtml(nicheId, nicheInfo, eventCount) {
  const name = nicheInfo ? nicheInfo.name : nicheId.replace(/-/g, ' ');
  const icon = nicheInfo ? nicheInfo.icon : '📅';
  const favorited = isFavorited(nicheId);

  return `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
      <span style="font-size: 2rem;">${icon}</span>
      <h1 style="margin: 0; font-size: var(--text-3xl);">${escapeHtml(name)}</h1>
      <button class="niche-card__favorite ${favorited ? 'niche-card__favorite--active' : ''}"
        data-niche="${escapeHtml(nicheId)}"
        style="position: static; margin-left: auto;"
        aria-label="${favorited ? 'Remove from' : 'Add to'} favorites"
        title="${favorited ? 'Remove from' : 'Add to'} favorites">
  ${favorited ? '♥' : '♡'}
</button>
    </div>
    <p class="section__subtitle">${eventCount} event${eventCount !== 1 ? 's' : ''} today in ${escapeHtml(name)}.</p>
  `;
}

/**
 * Build hero event card HTML.
 */
function buildHeroEventHtml(event, nicheConfig) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';

  const niches = (event.niches || []).slice(0, 3);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheConfigById(nicheId, nicheConfig);
      const name = info ? info.name : nicheId;
      const icon = info ? info.icon : '📅';
      return `<span class="badge badge-brand">${icon} ${name}</span>`;
    })
    .join(' ');

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
        <div class="event-card__footer">${badgesHtml}</div>
      </div>
    </article>
  `;
}

/**
 * Render the niche header and hero event.
 */
export async function renderNicheHero(nicheId) {
  const headerContainer = document.getElementById('niche-header-container');
  const heroContainer = document.getElementById('niche-hero-container');

  if (!headerContainer || !heroContainer) return;

  let nicheConfig = { niches: [] };

  try {
    const [eventsData, config] = await Promise.all([loadEvents(), loadNicheConfig()]);

    nicheConfig = config;
    const nicheInfo = getNicheConfigById(nicheId, nicheConfig);
    const nicheEvents =
      eventsData.niches && eventsData.niches[nicheId] ? eventsData.niches[nicheId] : [];

    headerContainer.innerHTML = buildNicheHeaderHtml(nicheId, nicheInfo, nicheEvents.length);

    if (nicheEvents.length > 0) {
      heroContainer.innerHTML = buildHeroEventHtml(nicheEvents[0], nicheConfig);
    } else {
      heroContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-12) 0;">
          <p style="font-size: var(--text-lg); color: var(--color-neutral-500);">
            No events today for this niche.
          </p>
          <p style="color: var(--color-neutral-400);">
            Check back tomorrow or explore another niche.
          </p>
        </div>`;
    }

    const nicheName = nicheInfo ? nicheInfo.name : nicheId.replace(/-/g, ' ');
    document.title = `${nicheName} — Today in History`;

    // Update breadcrumb
    // Update breadcrumb
    const breadcrumb = document.getElementById('breadcrumb-niche');
    if (breadcrumb) {
      const icon = nicheInfo ? nicheInfo.icon : '📅';
      breadcrumb.textContent = `${icon} ${nicheName}`;
    }

    // Update Open Graph meta tags
    const description =
      nicheEvents.length > 0
        ? nicheEvents[0].description.substring(0, 160)
        : `Explore ${nicheEvents.length} historical events in ${nicheName}.`;

    setMetaTag('og:title', `Today in ${nicheName} — Today in History`);
    setMetaTag('og:description', description);
    setMetaTag('twitter:title', `Today in ${nicheName} — Today in History`);
    setMetaTag('twitter:description', description);

    if (nicheEvents.length > 0 && nicheEvents[0].image_url) {
      setMetaTag('og:image', nicheEvents[0].image_url);
      setMetaTag('twitter:image', nicheEvents[0].image_url);
      setMetaTag('twitter:card', 'summary_large_image');
    }

    return { nicheEvents, nicheConfig, nicheInfo };
  } catch (error) {
    console.error('Error rendering niche hero:', error);
    headerContainer.innerHTML = '<p>Failed to load niche.</p>';
    return { nicheEvents: [], nicheConfig, nicheInfo: null };
  }
}

function setMetaTag(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Merged Timeline Builder Module
 * Renders the personalized merged feed as hero + timeline.
 */

import { buildMergedFeed } from './merged-feed-builder.js';
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
 * Build hero event HTML.
 */
function buildHeroHtml(event, nicheConfig) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';

  const niches = (event.niches || []).slice(0, 5);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheInfo(nicheId, nicheConfig);
      return `<span class="badge badge-brand">${info.icon} ${info.name}</span>`;
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
    </article>`;
}

/**
 * Build a regular event card HTML.
 */
function buildEventCardHtml(event, nicheConfig) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';

  const niches = (event.niches || []).slice(0, 5);
  const badgesHtml = niches
    .map((nicheId) => {
      const info = getNicheInfo(nicheId, nicheConfig);
      return `<span class="badge badge-brand badge-sm">${info.icon} ${info.name}</span>`;
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
 * Render the merged timeline.
 */
export async function renderMergedTimeline() {
  const heroContainer = document.getElementById('merged-hero-container');
  const timelineContainer = document.getElementById('merged-timeline-container');
  const mergedSection = document.getElementById('merged-timeline-section');

  if (!heroContainer || !timelineContainer) return;

  try {
    const mergedEvents = await buildMergedFeed();

    if (mergedEvents.length === 0) {
      if (mergedSection) mergedSection.style.display = 'none';
      return;
    }

    const nicheConfig = await loadNicheConfig();

    // Render hero
    heroContainer.innerHTML = buildHeroHtml(mergedEvents[0], nicheConfig);

    // Render timeline
    const remainingEvents = mergedEvents.slice(1);
    if (remainingEvents.length > 0) {
      const cardsHtml = remainingEvents
        .map((event) => buildEventCardHtml(event, nicheConfig))
        .join('');
      timelineContainer.innerHTML = cardsHtml;
    } else {
      timelineContainer.innerHTML = '';
    }

    // Update OG meta tags
    updateMetaTags(mergedEvents);
  } catch (error) {
    console.error('Error rendering merged timeline:', error);
    heroContainer.innerHTML = '<p>Failed to load your personalized timeline.</p>';
  }
}

/**
 * Update Open Graph meta tags for the merged feed.
 */
function updateMetaTags(events) {
  const count = events.length;
  const topEvent = events[0];

  const title = `Your Personalized Timeline (${count} events) — Today in History`;
  const description = topEvent
    ? topEvent.description.substring(0, 160)
    : 'Your personalized timeline of historical events.';

  setMetaTag('og:title', title);
  setMetaTag('og:description', description);
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);

  if (topEvent && topEvent.image_url) {
    setMetaTag('og:image', topEvent.image_url);
    setMetaTag('twitter:image', topEvent.image_url);
    setMetaTag('twitter:card', 'summary_large_image');
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

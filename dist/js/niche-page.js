/**
 * Niche Page — Entry Point
 * Reads niche ID from URL and renders the niche page.
 */

import { renderNicheHero } from './modules/niche-hero-builder.js';
import { renderNicheEventList } from './modules/niche-event-list.js';
import { initFavoriteButtons } from './modules/favorites-manager.js';
import { renderRelatedNiches } from './modules/related-niches.js';

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
 * Render the full niche page.
 */
async function renderNichePage() {
  const nicheId = getNicheIdFromUrl();

  if (!nicheId) {
    document.body.innerHTML =
      '<main class="container"><section class="section"><p>No niche specified. <a href="/">Go home</a>.</p></section></main>';
    return;
  }

  // Render hero
  const result = await renderNicheHero(nicheId);
  if (!result) return;

  const { nicheEvents } = result;

  // Render event list with expand/collapse
  await renderNicheEventList(nicheEvents);

  // Render related niches
  await renderRelatedNiches(nicheId);

  // Initialize favorites
  initFavoriteButtons();
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNichePage);
} else {
  renderNichePage();
}

/**
 * Today in History — Main Application
 */

import { renderHero } from './modules/hero-builder.js';
import { renderTimeline } from './modules/timeline-builder.js';
import { renderNicheGrid } from './modules/niche-grid-builder.js';
import { initFavoriteButtons } from './modules/favorites-manager.js';

/**
 * Initialize the application when the DOM is ready.
 */
async function init() {
  console.log('Today in History — Initializing...');

  // Render all sections in order, waiting for each to complete
  await renderHero();
  await renderTimeline();
  await renderNicheGrid();

  // Initialize favorites after niche grid is in the DOM
  initFavoriteButtons();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

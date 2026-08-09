/**
 * Today in History — Main Application
 */

import { renderHero } from './modules/hero-builder.js';
import { renderTimeline } from './modules/timeline-builder.js';
import { renderNicheGrid } from './modules/niche-grid-builder.js';

/**
 * Initialize the application when the DOM is ready.
 */
function init() {
  console.log('Today in History — Initializing...');

  // Render all sections
  renderHero();
  renderTimeline();
  renderNicheGrid();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

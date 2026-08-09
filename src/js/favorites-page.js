/**
 * Favorites Page — Entry Point
 * Shows personalized timeline or empty state based on favorites.
 */

import { getFavorites, initFavoriteButtons } from './modules/favorites-manager.js';

/**
 * Initialize the favorites page.
 */
function initFavoritesPage() {
  const favorites = getFavorites();
  const emptySection = document.getElementById('favorites-empty-section');
  const contentSection = document.getElementById('favorites-content-section');

  if (!emptySection || !contentSection) return;

  if (favorites.length === 0) {
    // Show empty state
    emptySection.style.display = 'block';
    contentSection.style.display = 'none';
  } else {
    // Show content (will be populated in Tasks 7.3-7.5)
    emptySection.style.display = 'none';
    contentSection.style.display = 'block';
  }

  // Initialize favorites counter in header
  initFavoriteButtons();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFavoritesPage);
} else {
  initFavoritesPage();
}

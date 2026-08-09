import { getFavorites, initFavoriteButtons } from './modules/favorites-manager.js';
import { renderQuickJump } from './modules/quick-jump-builder.js';
import { renderMergedTimeline } from './modules/merged-timeline-builder.js';

/**
 * Refresh the entire favorites page content.
 */
async function refreshFavoritesContent() {
  const favorites = getFavorites();
  const emptySection = document.getElementById('favorites-empty-section');
  const contentSection = document.getElementById('favorites-content-section');

  if (favorites.length === 0) {
    emptySection.style.display = 'block';
    contentSection.style.display = 'none';
  } else {
    emptySection.style.display = 'none';
    contentSection.style.display = 'block';
    await renderQuickJump();
    await renderMergedTimeline();
  }
}

async function initFavoritesPage() {
  await refreshFavoritesContent();
  initFavoriteButtons();

  // Listen for custom event to refresh content when favorites change
  document.addEventListener('favoritesUpdated', refreshFavoritesContent);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFavoritesPage);
} else {
  initFavoritesPage();
}

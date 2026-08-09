import { getFavorites, initFavoriteButtons } from './modules/favorites-manager.js';
import { renderQuickJump } from './modules/quick-jump-builder.js';

async function initFavoritesPage() {
  const favorites = getFavorites();
  const emptySection = document.getElementById('favorites-empty-section');
  const contentSection = document.getElementById('favorites-content-section');

  if (!emptySection || !contentSection) return;

  if (favorites.length === 0) {
    emptySection.style.display = 'block';
    contentSection.style.display = 'none';
  } else {
    emptySection.style.display = 'none';
    contentSection.style.display = 'block';

    // Render quick-jump row
    await renderQuickJump();
  }

  initFavoriteButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFavoritesPage);
} else {
  initFavoritesPage();
}

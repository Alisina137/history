/**
 * Favorites Manager Module
 * Handles add, remove, toggle, persistence, and UI updates.
 */

const STORAGE_KEY = 'favoriteNiches';

/**
 * Get the current list of favorited niche IDs.
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save the favorites list to localStorage.
 */
function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

/**
 * Add a niche to favorites.
 */
export function addFavorite(nicheId) {
  const favorites = getFavorites();
  if (!favorites.includes(nicheId)) {
    favorites.push(nicheId);
    saveFavorites(favorites);
  }
  updateAllUI();
}

/**
 * Remove a niche from favorites.
 */
export function removeFavorite(nicheId) {
  let favorites = getFavorites();
  favorites = favorites.filter((id) => id !== nicheId);
  saveFavorites(favorites);
  updateAllUI();
}

/**
 * Toggle a niche in/out of favorites.
 */
export function toggleFavorite(nicheId) {
  const favorites = getFavorites();
  if (favorites.includes(nicheId)) {
    removeFavorite(nicheId);
  } else {
    addFavorite(nicheId);
  }
}

/**
 * Check if a niche is favorited.
 */
export function isFavorited(nicheId) {
  return getFavorites().includes(nicheId);
}

/**
 * Get the number of favorited niches.
 */
export function getFavoritesCount() {
  return getFavorites().length;
}

/**
 * Update the favorites counter in the header navigation.
 */
function updateFavoritesCount() {
  const countElement = document.getElementById('favorites-count');
  if (!countElement) return;

  const count = getFavoritesCount();

  if (count > 0) {
    countElement.textContent = count;
    countElement.style.display = 'inline-flex';
  } else {
    countElement.textContent = '';
    countElement.style.display = 'none';
  }
}

/**
 * Update all favorite button states on the page.
 */
function updateFavoriteButtons() {
  const favorites = getFavorites();

  document.querySelectorAll('.niche-card__favorite').forEach((button) => {
    const nicheId = button.dataset.niche;
    const isActive = favorites.includes(nicheId);

    if (isActive) {
      button.classList.add('niche-card__favorite--active');
      button.innerHTML = '♥';
      button.setAttribute('aria-label', 'Remove from favorites');
    } else {
      button.classList.remove('niche-card__favorite--active');
      button.innerHTML = '♡';
      button.setAttribute('aria-label', 'Add to favorites');
    }
  });
}

/**
 * Update all UI elements: buttons, counter.
 */
function updateAllUI() {
  updateFavoriteButtons();
  updateFavoritesCount();

  // Dispatch custom event so other pages can react
  document.dispatchEvent(new CustomEvent('favoritesUpdated'));
}
/**
 * Attach click handlers to all favorite buttons on the page.
 */
export function initFavoriteButtons() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.niche-card__favorite');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const nicheId = button.dataset.niche;
    if (nicheId) {
      toggleFavorite(nicheId);
    }
  });

  // Update UI on page load
  updateAllUI();
}

/**
 * Listen for localStorage changes from other tabs.
 * Updates UI when favorites change in another tab.
 */
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    updateAllUI();
  }
});

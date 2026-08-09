/**
 * Quick-Jump Builder Module
 * Renders compact niche cards for favorited niches.
 */

import { loadEvents, loadNicheConfig } from './data-loader.js';
import { getFavorites, isFavorited } from './favorites-manager.js';

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
 * Build a compact niche card for the quick-jump row.
 */
function buildQuickJumpCardHtml(nicheId, nicheConfig, count) {
  const niche = nicheConfig.niches.find((n) => n.id === nicheId);
  if (!niche) return '';

  const name = niche.name;
  const icon = niche.icon;

  return `
    <div class="niche-card" data-niche="${escapeHtml(nicheId)}" style="min-height: 120px;">
      <div class="niche-card__bg" style="background: linear-gradient(135deg, #3b82f6, #60a5fa); opacity: 0.08;"></div>
      <div class="niche-card__content">
        <div>
          <div class="niche-card__icon">${icon}</div>
          <h4 class="niche-card__title">${escapeHtml(name)}</h4>
        </div>
        <div class="niche-card__footer">
          <span class="niche-card__count">+${count} events</span>
          <button class="niche-card__favorite niche-card__favorite--active"
                  data-niche="${escapeHtml(nicheId)}"
                  aria-label="Remove from favorites">
            ♥
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the quick-jump row with favorited niche cards.
 */
export async function renderQuickJump(containerId = 'quick-jump-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const favoriteIds = getFavorites();

  if (favoriteIds.length === 0) {
    container.innerHTML = '';
    return;
  }

  try {
    const [eventsData, nicheConfig] = await Promise.all([loadEvents(), loadNicheConfig()]);

    // Calculate event counts per niche
    const nicheGroups = eventsData.niches || {};
    const counts = {};
    for (const [nicheId, events] of Object.entries(nicheGroups)) {
      counts[nicheId] = events.length;
    }

    // Build cards for favorited niches only
    const cardsHtml = favoriteIds
      .map((nicheId) => {
        const count = counts[nicheId] || 0;
        return buildQuickJumpCardHtml(nicheId, nicheConfig, count);
      })
      .join('');

    container.innerHTML = cardsHtml;

    // Attach click handlers for navigation
    container.querySelectorAll('.niche-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.niche-card__favorite')) return;
        const nicheId = card.dataset.niche;
        if (nicheId) {
          window.location.href = `/niche.html?niche=${nicheId}`;
        }
      });
    });
  } catch (error) {
    console.error('Error rendering quick-jump:', error);
    container.innerHTML = '<p>Failed to load favorite niches.</p>';
  }
}

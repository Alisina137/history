/**
 * Share Utility Module
 * Uses Web Share API with clipboard fallback.
 */

/**
 * Share a page using the native Web Share API.
 * Falls back to copying the URL to clipboard.
 *
 * @param {string} title - Share title
 * @param {string} text - Share description
 * @param {string} url - URL to share (defaults to current page)
 */
export async function sharePage(title, text, url) {
  const shareData = {
    title: title,
    text: text,
    url: url || window.location.href,
  };

  // Try native share (works on mobile Safari, Chrome Android)
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return;
    }
  }

  // Fallback: copy to clipboard
  try {
    const shareText = `${title}\n${text}\n${shareData.url}`;
    await navigator.clipboard.writeText(shareText);
    showToast('Link copied to clipboard!');
  } catch {
    showToast('Could not copy link. Please copy the URL manually.');
  }
}

/**
 * Show a temporary toast notification.
 */
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

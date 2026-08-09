/**
 * Merged Feed Builder Module
 * Filters, deduplicates, merges badges, and re-ranks events
 * from multiple favorited niches into a single personalized timeline.
 */

import { loadEvents } from './data-loader.js';
import { getFavorites } from './favorites-manager.js';

/**
 * Build a merged feed of events from all favorited niches.
 *
 * Steps:
 * 1. Collect all events from favorited niches.
 * 2. Deduplicate by event description (same event in multiple niches).
 * 3. Merge niche badges from deduplicated events.
 * 4. Re-rank by global_score (highest first).
 * 5. Return top 20.
 *
 * @returns {Array} Top 20 merged and ranked events.
 */
export async function buildMergedFeed() {
  const favoriteIds = getFavorites();

  if (favoriteIds.length === 0) {
    return [];
  }

  try {
    const eventsData = await loadEvents();
    const nicheGroups = eventsData.niches || {};

    // Step 1: Collect all events from favorited niches
    let allEvents = [];
    for (const nicheId of favoriteIds) {
      const nicheEvents = nicheGroups[nicheId] || [];
      allEvents = allEvents.concat(nicheEvents);
    }

    if (allEvents.length === 0) {
      return [];
    }

    // Step 2: Deduplicate by description
    // Events with the same description are the same historical event
    const uniqueMap = new Map();

    for (const event of allEvents) {
      const key = event.description;

      if (uniqueMap.has(key)) {
        // Merge niches from the duplicate
        const existing = uniqueMap.get(key);
        const mergedNiches = [...new Set([...existing.niches, ...(event.niches || [])])];
        existing.niches = mergedNiches;
      } else {
        // Create a copy to avoid mutating original data
        uniqueMap.set(key, { ...event, niches: [...(event.niches || [])] });
      }
    }

    // Step 3: Convert map back to array
    const uniqueEvents = Array.from(uniqueMap.values());

    // Step 4: Re-rank by global_score descending
    uniqueEvents.sort((a, b) => (b.global_score || 0) - (a.global_score || 0));

    // Step 5: Return top 20
    return uniqueEvents.slice(0, 20);
  } catch (error) {
    console.error('Error building merged feed:', error);
    return [];
  }
}

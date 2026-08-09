/**
 * Data Loader Module
 * Fetches and caches events.json and niche data.
 */

const DATA_URL = '/data/events.json';
const NICHE_CONFIG_URL = '/data/niche_config.json';

let cachedEvents = null;
let cachedNicheConfig = null;

/**
 * Load events data. Caches the result so multiple components
 * can call this without re-fetching.
 */
export async function loadEvents() {
  if (cachedEvents) {
    return cachedEvents;
  }

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load events: ${response.status}`);
    }
    const data = await response.json();
    cachedEvents = data;
    return data;
  } catch (error) {
    console.error('Error loading events:', error);
    return { events: [], niches: {} };
  }
}

/**
 * Load niche configuration (names, icons, etc.).
 */
export async function loadNicheConfig() {
  if (cachedNicheConfig) {
    return cachedNicheConfig;
  }

  try {
    const response = await fetch(NICHE_CONFIG_URL);
    if (!response.ok) {
      throw new Error(`Failed to load niche config: ${response.status}`);
    }
    const data = await response.json();
    cachedNicheConfig = data;
    return data;
  } catch (error) {
    console.error('Error loading niche config:', error);
    return { niches: [] };
  }
}

/**
 * Static Site Builder
 * Reads data/events.json and generates static HTML pages.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const SRC_DIR = join(__dirname, 'src');
const DIST_DIR = join(__dirname, 'dist');

function loadEvents() {
  const eventsPath = join(DATA_DIR, 'events.json');
  const raw = readFileSync(eventsPath, 'utf-8');
  return JSON.parse(raw);
}

function loadNicheSummaries() {
  const summaryPath = join(DATA_DIR, 'niche_summaries.json');
  const raw = readFileSync(summaryPath, 'utf-8');
  return JSON.parse(raw);
}

function loadNichesConfig() {
  const configPath = join(__dirname, 'pipeline', 'config', 'niches.json');
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderEventCard(event, isHero = false) {
  const year = escapeHtml(String(event.year));
  const description = escapeHtml(event.description);
  const imageUrl = event.image_url || '';
  const niches = (event.niches || []).slice(0, 3);
  const nicheTags = niches
    .map((n) => `<span class="badge badge-brand badge-sm">${escapeHtml(n)}</span>`)
    .join(' ');

  if (isHero) {
    const bgStyle = imageUrl
      ? `style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"`
      : 'style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);"';

    return `
    <article class="event-card event-card--hero">
      <div class="event-card__image" ${bgStyle}></div>
      <div class="event-card__body">
        <span class="event-card__year">${year}</span>
        <p class="event-card__description">${description}</p>
        <div class="event-card__footer">${nicheTags}</div>
      </div>
    </article>`;
  }

  const imageBlock = imageUrl
    ? `<div class="event-card__image"><img src="${imageUrl}" alt="" loading="lazy"></div>`
    : '';

  return `
    <article class="event-card">
      <span class="event-card__year">${year}</span>
      <div class="event-card__content">
        <p class="event-card__description">${description}</p>
        <div class="event-card__footer">${nicheTags}</div>
      </div>
      ${imageBlock}
    </article>`;
}

function renderNicheCard(nicheId, summary, config) {
  const nicheConfig = config.niches.find((n) => n.id === nicheId) || {};
  const name = nicheConfig.name || nicheId;
  const icon = nicheConfig.icon || '📅';
  const count = summary.count || 0;
  const topEvent = summary.top_event;
  const teaser = topEvent
    ? escapeHtml(topEvent.description).substring(0, 80) + '...'
    : 'No events today';
  const bgImage = topEvent?.image_url || '';

  const bgStyle = bgImage
    ? `style="background-image: url('${bgImage}'); background-size: cover; background-position: center; opacity: 0.15;"`
    : `style="background: linear-gradient(135deg, #3b82f6, #60a5fa); opacity: 0.1;"`;

  return `
    <a href="/niche/${nicheId}.html" class="niche-card">
      <div class="niche-card__bg" ${bgStyle}></div>
      <div class="niche-card__content">
        <div>
          <div class="niche-card__icon">${icon}</div>
          <h4 class="niche-card__title">${name}</h4>
          <p class="niche-card__teaser">${teaser}</p>
        </div>
        <div class="niche-card__footer">
          <span class="niche-card__count">+${count} events</span>
          <button class="niche-card__favorite" data-niche="${nicheId}" aria-label="Add to favorites">♡</button>
        </div>
      </div>
    </a>`;
}

function renderHeader() {
  return `
  <header class="header">
    <div class="header__inner">
      <a href="/index.html" class="header__logo">
        <span class="header__logo-icon">📅</span>
        <span>Today in History</span>
      </a>
      <nav class="header__nav">
        <a href="/index.html" class="header__nav-link header__nav-link--active">Home</a>
        <a href="/favorites.html" class="header__favorites header__nav-link">
          ♥
          <span class="header__favorites-count" id="favorites-count"></span>
          <span class="hide-mobile">Favorites</span>
        </a>
      </nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">📅 Today in History</div>
      <p class="footer__text">Explore the past through your passions. A new story every day.</p>
      <p class="footer__bottom">&copy; ${new Date().getFullYear()} Today in History. All rights reserved.</p>
    </div>
  </footer>`;
}

function buildHomepage(events, nicheSummaries, config) {
  const top20 = events.slice(0, 20);
  const heroEvent = renderEventCard(top20[0], true);
  const timelineEvents = top20
    .slice(1)
    .map((e) => renderEventCard(e, false))
    .join('\n');

  const nicheCards = Object.entries(nicheSummaries)
    .map(([id, summary]) => renderNicheCard(id, summary, config))
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today in History — What Happened Today</title>
  <meta name="description" content="Discover what happened today in history. Explore events by your passions with AI-generated visuals.">
  <meta property="og:title" content="Today in History">
  <meta property="og:description" content="Discover what happened today in history.">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${renderHeader()}
  <main class="container">
    <section class="section">
      ${heroEvent}
    </section>
    <section class="section">
      <h2 class="section__title">More Events Today</h2>
      <div class="timeline">
        ${timelineEvents}
      </div>
    </section>
    <section class="section">
      <h2 class="section__title">Explore by Your Passion</h2>
      <p class="section__subtitle">Choose a niche and discover what happened today.</p>
      <div class="niche-grid">
        ${nicheCards}
      </div>
    </section>
  </main>
  ${renderFooter()}
  <script src="/js/app.js"></script>
  <script src="/js/favorites.js"></script>
</body>
</html>`;

  return html;
}

function buildNichePage(nicheId, nicheEvents, config) {
  const nicheConfig = config.niches.find((n) => n.id === nicheId) || {};
  const name = nicheConfig.name || nicheId;
  const icon = nicheConfig.icon || '📅';
  const top20 = nicheEvents.slice(0, 20);

  const heroEvent =
    top20.length > 0 ? renderEventCard(top20[0], true) : '<p>No events today for this niche.</p>';
  const eventList = top20
    .slice(1)
    .map((e) => renderEventCard(e, false))
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Today in History</title>
  <meta name="description" content="What happened today in ${name}. Explore historical events in ${name}.">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${renderHeader()}
  <main class="container">
    <section class="section">
      <a href="/index.html" class="btn btn-ghost btn-sm" style="margin-bottom: 16px;">← Back to All Niches</a>
      <h2 class="section__title">${icon} ${name}</h2>
      <p class="section__subtitle">${top20.length} events today in ${name}.</p>
      ${heroEvent}
    </section>
    <section class="section">
      <div class="timeline">
        ${eventList}
      </div>
    </section>
  </main>
  ${renderFooter()}
  <script src="/js/app.js"></script>
  <script src="/js/favorites.js"></script>
</body>
</html>`;

  return html;
}

function buildFavoritesPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Favorites — Today in History</title>
  <meta name="description" content="Your personalized timeline of historical events.">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${renderHeader()}
  <main class="container">
    <section class="section">
      <h2 class="section__title">Your Favorites</h2>
      <p class="section__subtitle">Your personalized timeline based on your favorite niches.</p>
      <div id="favorites-empty" style="display: none;">
        <p>You haven't favorited any niches yet.</p>
        <a href="/index.html" class="btn btn-primary">Explore Niches</a>
      </div>
      <div id="favorites-content">
        <div id="favorite-niches-row" class="niche-grid"></div>
        <div id="favorites-timeline" class="timeline"></div>
      </div>
    </section>
  </main>
  ${renderFooter()}
  <script src="/js/app.js"></script>
  <script src="/js/favorites.js"></script>
</body>
</html>`;

  return html;
}

function copyAssets() {
  // Copy CSS and JS from src to dist
  const dirs = ['styles', 'js', 'assets'];
  for (const dir of dirs) {
    const srcDir = join(SRC_DIR, dir);
    const distDir = join(DIST_DIR, dir);
    if (existsSync(srcDir)) {
      mkdirSync(distDir, { recursive: true });
      copyRecursive(srcDir, distDir);
    }
  }
}

function copyRecursive(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// ---- Main Build ----
function build() {
  console.log('Building static site...');

  // Load data
  const data = loadEvents();
  const nicheSummaries = loadNicheSummaries();
  const config = loadNichesConfig();

  const events = data.events || [];
  const nicheGroups = data.niches || {};

  console.log(`  Events: ${events.length}`);
  console.log(`  Niches: ${Object.keys(nicheGroups).length}`);

  // Create dist directory
  mkdirSync(DIST_DIR, { recursive: true });

  // Copy assets
  console.log('  Copying assets...');
  copyAssets();

  // Build homepage
  console.log('  Building homepage...');
  const homepageHtml = buildHomepage(events, nicheSummaries, config);
  writeFileSync(join(DIST_DIR, 'index.html'), homepageHtml);

  // Build niche pages
  console.log('  Building niche pages...');
  for (const [nicheId, nicheEvents] of Object.entries(nicheGroups)) {
    const nicheDir = join(DIST_DIR, 'niche');
    mkdirSync(nicheDir, { recursive: true });
    const nicheHtml = buildNichePage(nicheId, nicheEvents, config);
    writeFileSync(join(nicheDir, `${nicheId}.html`), nicheHtml);
  }
  console.log(`  Built ${Object.keys(nicheGroups).length} niche pages.`);

  // Build favorites page
  console.log('  Building favorites page...');
  const favoritesHtml = buildFavoritesPage();
  writeFileSync(join(DIST_DIR, 'favorites.html'), favoritesHtml);

  console.log('Build complete!');
}

build();

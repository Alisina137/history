/**
 * Static Site Builder
 * Reads data/events.json and generates static HTML pages with OG tags.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

/**
 * Run the Python pipeline for a specific date.
 * Returns true if successful.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const SRC_DIR = join(__dirname, 'src');
const DIST_DIR = join(__dirname, 'dist');

/**
 * Build niche pages for specific dates.
 * Loads events from data/events_YYYY-MM-DD.json for each date.
 */
function buildHistoricalNichePages(nicheGroups, config, dates) {
  console.log(`  Building historical niche pages for ${dates.length} dates...`);
  let totalPages = 0;

  for (const date of dates) {
    const dateStr = `2026-${date.label}`; // Use current year
    const eventsPath = join(DATA_DIR, `events_${dateStr}.json`);

    if (!existsSync(eventsPath)) {
      // Try running pipeline for this date
      const success = runPipelineForDate(date.month, date.day);
      if (!success) continue;
    }

    // Verify file exists after pipeline run
    if (!existsSync(eventsPath)) continue;

    try {
      const raw = readFileSync(eventsPath, 'utf-8');
      const data = JSON.parse(raw);
      const dateNicheGroups = data.niches || {};

      for (const [nicheId, nicheEvents] of Object.entries(dateNicheGroups)) {
        if (nicheEvents.length === 0) continue;

        const nicheDir = join(DIST_DIR, 'niche', nicheId);
        mkdirSync(nicheDir, { recursive: true });

        const nicheHtml = buildNichePage(nicheId, nicheEvents, config);
        writeFileSync(join(nicheDir, `${date.label}.html`), nicheHtml);
        totalPages++;
      }
    } catch (err) {
      console.error(`    Error processing ${dateStr}: ${err.message}`);
    }
  }

  console.log(`  Generated ${totalPages} historical niche pages.`);
  return totalPages;
}

function runPipelineForDate(month, day) {
  try {
    console.log(`    Running pipeline for ${month}/${day}...`);
    execSync(`python pipeline/main.py ${month} ${day}`, {
      cwd: __dirname,
      stdio: 'pipe',
      timeout: 120000, // 2 minute timeout
    });
    return true;
  } catch (error) {
    console.error(`    Pipeline failed for ${month}/${day}: ${error.message}`);
    return false;
  }
}

/**
 * Get a list of dates to generate pages for.
 * MVP: current month dates. Expand later to full year.
 */
function getDatesToGenerate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const daysInMonth = new Date(year, month, 0).getDate();

  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push({
      month: month,
      day: day,
      label: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }

  // Always include some historically significant dates
  const significantDates = [
    { month: 7, day: 4, label: '07-04' }, // US Independence Day
    { month: 7, day: 20, label: '07-20' }, // Moon landing
    { month: 12, day: 25, label: '12-25' }, // Christmas
    { month: 1, day: 1, label: '01-01' }, // New Year
    { month: 11, day: 11, label: '11-11' }, // Armistice Day
  ];

  for (const sd of significantDates) {
    if (!dates.find((d) => d.month === sd.month && d.day === sd.day)) {
      dates.push(sd);
    }
  }

  return dates;
}

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

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Generate Open Graph and Twitter meta tags for social sharing.
 */
function generateOgTags(title, description, imageUrl, url) {
  const tags = [];
  tags.push(`<meta property="og:title" content="${escapeAttr(title)}">`);
  tags.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
  tags.push('<meta property="og:type" content="website">');
  tags.push(`<meta property="og:url" content="${escapeAttr(url)}">`);
  tags.push(`<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">`);
  tags.push(`<meta name="twitter:title" content="${escapeAttr(title)}">`);
  tags.push(`<meta name="twitter:description" content="${escapeAttr(description)}">`);
  if (imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeAttr(imageUrl)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeAttr(imageUrl)}">`);
  }
  return tags.join('\n    ');
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
      <div class="event-card__image" ${bgStyle}>
        <div class="hero-overlay"></div>
      </div>
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
    : 'style="background: linear-gradient(135deg, #3b82f6, #60a5fa); opacity: 0.1;"';

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

function renderHeader(activePage) {
  const homeActive = activePage === 'home' ? ' header__nav-link--active' : '';
  const favActive = activePage === 'favorites' ? ' header__nav-link--active' : '';

  return `
  <header class="header">
    <div class="header__inner">
      <a href="/index.html" class="header__logo">
        <span class="header__logo-icon">📅</span>
        <span>Today in History</span>
      </a>
      <nav class="header__nav">
        <a href="/index.html" class="header__nav-link${homeActive}">Home</a>
        <a href="/favorites.html" class="header__favorites header__nav-link${favActive}">
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

  // OG tags from top event
  const topEvent = top20[0];
  const ogTitle = 'Today in History — Discover What Happened Today';
  const ogDesc = topEvent
    ? `${topEvent.year}: ${topEvent.description.substring(0, 120)}...`
    : 'Discover what happened today in history. Explore events by your passions.';
  const ogImage = topEvent && topEvent.image_url ? topEvent.image_url : '';
  const ogUrl = 'https://today-in-history.pages.dev/';
  const ogTags = generateOgTags(ogTitle, ogDesc, ogImage, ogUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today in History — Discover What Happened Today</title>
  <meta name="description" content="${escapeAttr(ogDesc)}">
  ${ogTags}
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${renderHeader('home')}
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
  <script type="module" src="/js/app.js"></script>
  <script type="module" src="/js/favorites-manager.js"></script>
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

  // OG tags
  const ogTitle = `Today in ${name} — Today in History`;
  const ogDesc =
    top20.length > 0
      ? `${top20[0].year}: ${top20[0].description.substring(0, 120)}...`
      : `Explore historical events in ${name}.`;
  const ogImage = top20.length > 0 && top20[0].image_url ? top20[0].image_url : '';
  const ogUrl = `https://today-in-history.pages.dev/niche/${nicheId}.html`;
  const ogTags = generateOgTags(ogTitle, ogDesc, ogImage, ogUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} — Today in History</title>
  <meta name="description" content="${escapeAttr(ogDesc)}">
  ${ogTags}
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${renderHeader()}
  <main class="container">
    <section class="section">
      <a href="/index.html" class="btn btn-ghost btn-sm" style="margin-bottom: 16px;">← Back to All Niches</a>
      <h2 class="section__title">${icon} ${escapeHtml(name)}</h2>
      <p class="section__subtitle">${top20.length} events today in ${escapeHtml(name)}.</p>
      ${heroEvent}
    </section>
    <section class="section">
      <div class="timeline">
        ${eventList}
      </div>
    </section>
  </main>
  ${renderFooter()}
  <script type="module" src="/js/niche-page.js"></script>
  <script type="module" src="/js/favorites-manager.js"></script>
</body>
</html>`;

  return html;
}

function buildFavoritesPage() {
  const ogTitle = 'Your Favorites — Today in History';
  const ogDesc = 'Your personalized timeline of historical events based on your favorite niches.';
  const ogUrl = 'https://today-in-history.pages.dev/favorites.html';
  const ogTags = generateOgTags(ogTitle, ogDesc, '', ogUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Favorites — Today in History</title>
  <meta name="description" content="${escapeAttr(ogDesc)}">
  ${ogTags}
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${renderHeader('favorites')}
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
  <script type="module" src="/js/favorites-page.js"></script>
  <script type="module" src="/js/favorites-manager.js"></script>
</body>
</html>`;

  return html;
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

function copyAssets() {
  const dirs = ['styles', 'js', 'assets', 'data'];
  for (const dir of dirs) {
    const srcDir = join(SRC_DIR, dir);
    if (existsSync(srcDir)) {
      const destDir = join(DIST_DIR, dir);
      mkdirSync(destDir, { recursive: true });
      copyRecursive(srcDir, destDir);
    }
  }
}

// ---- Main Build ----
function build() {
  console.log('Building static site...');

  const data = loadEvents();
  const nicheSummaries = loadNicheSummaries();
  const config = loadNichesConfig();

  const events = data.events || [];
  const nicheGroups = data.niches || {};

  console.log(`  Events: ${events.length}`);
  console.log(`  Niches: ${Object.keys(nicheGroups).length}`);

  mkdirSync(DIST_DIR, { recursive: true });

  console.log('  Copying assets...');
  copyAssets();

  console.log('  Building homepage...');
  const homepageHtml = buildHomepage(events, nicheSummaries, config);
  writeFileSync(join(DIST_DIR, 'index.html'), homepageHtml);

  console.log("  Building today's niche pages...");
  for (const [nicheId, nicheEvents] of Object.entries(nicheGroups)) {
    const nicheDir = join(DIST_DIR, 'niche', nicheId);
    mkdirSync(nicheDir, { recursive: true });
    const nicheHtml = buildNichePage(nicheId, nicheEvents, config);
    writeFileSync(join(nicheDir, 'index.html'), nicheHtml);
  }
  console.log(`  Built ${Object.keys(nicheGroups).length} niche pages.`);

  console.log('  Building favorites page...');
  const favoritesHtml = buildFavoritesPage();
  writeFileSync(join(DIST_DIR, 'favorites.html'), favoritesHtml);

  // Build historical pages
  const dates = getDatesToGenerate();
  buildHistoricalNichePages(nicheGroups, config, dates);

  console.log('Build complete!');
}

build();

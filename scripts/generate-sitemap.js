/**
 * Sitemap Generator
 * Scans dist/ directory and generates sitemap.xml
 */

import { readdirSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const SITE_URL = 'https://today-in-history.pages.dev';

/**
 * Get all HTML files recursively from a directory.
 */
function getHtmlFiles(dir, basePath = '') {
  const files = [];

  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...getHtmlFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.html')) {
      const stats = statSync(fullPath);
      files.push({
        path: relativePath,
        lastmod: stats.mtime.toISOString().split('T')[0],
      });
    }
  }

  return files;
}

/**
 * Determine page priority based on path.
 */
function getPriority(filePath) {
  if (filePath === 'index.html') return '1.0';
  if (filePath === 'favorites.html') return '0.7';
  if (filePath.startsWith('on-this-day/')) return '0.8';
  if (filePath.includes('/index.html')) return '0.9'; // Niche index pages
  if (filePath.match(/\/\d{2}-\d{2}\.html$/)) return '0.6'; // Date-specific pages
  return '0.5';
}

/**
 * Determine change frequency based on path.
 */
function getChangeFreq(filePath) {
  if (filePath === 'index.html') return 'daily';
  if (filePath.includes('/index.html')) return 'daily';
  if (filePath.startsWith('on-this-day/')) return 'yearly';
  if (filePath.match(/\/\d{2}-\d{2}\.html$/)) return 'yearly';
  return 'weekly';
}

/**
 * Generate sitemap.xml content.
 */
function generateSitemapXml(files) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const file of files) {
    const loc = file.path === 'index.html' ? SITE_URL : `${SITE_URL}/${file.path}`;

    const priority = getPriority(file.path);
    const changefreq = getChangeFreq(file.path);

    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${file.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

// ---- Main ----
function generate() {
  console.log('Generating sitemap...');

  const files = getHtmlFiles(DIST_DIR);
  console.log(`  Found ${files.length} HTML files.`);

  const sitemap = generateSitemapXml(files);
  const outputPath = join(DIST_DIR, 'sitemap.xml');
  writeFileSync(outputPath, sitemap);

  console.log(`  Sitemap saved to ${outputPath}`);
  console.log(`  Lines: ${sitemap.split('\n').length}`);
}

generate();

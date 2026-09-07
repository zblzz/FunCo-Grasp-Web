import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const html = readFileSync(join(output, 'index.html'), 'utf8');
const css = readFileSync(join(output, 'styles.css'), 'utf8');
const js = readFileSync(join(output, 'site.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML id');
assert.equal([...html.matchAll(/<h1\b/g)].length, 1, 'Expected one main heading');
for (const [, link] of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) {
  assert(!/^(?:[a-z]+:|\/\/)/i.test(link), 'External URL: ' + link);
  if (link.startsWith('#')) assert(ids.includes(link.slice(1)), 'Broken anchor: ' + link);
  else {
    const target = resolve(output, link);
    assert(target.startsWith(output + '/'), 'Path escapes output');
    assert(existsSync(target), 'Missing asset: ' + link);
  }
}
for (const match of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(match[0]), 'Image missing alt');
for (const match of html.matchAll(/<img\b[^>]*src="([^"]+\.png)"[^>]*>/g)) {
  const png = readFileSync(join(output, match[1]));
  const width = /\bwidth="(\d+)"/.exec(match[0]);
  const height = /\bheight="(\d+)"/.exec(match[0]);
  if (width) assert.equal(Number(width[1]), png.readUInt32BE(16), 'Wrong image width');
  if (height) assert.equal(Number(height[1]), png.readUInt32BE(20), 'Wrong image height');
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    assert(!['tEXt', 'iTXt', 'zTXt', 'eXIf'].includes(type), 'Image contains text/EXIF metadata: ' + match[1]);
    offset += length + 12;
  }
}
assert(/name="robots" content="noindex, nofollow, noarchive"/.test(html));
assert(/name="referrer" content="no-referrer"/.test(html));
assert(/Content-Security-Policy/.test(html));
assert(/prefers-reduced-motion/.test(css));
assert(/@media\(max-width:700px\)/.test(css));
assert(html.indexOf('id="video"') < html.indexOf('id="abstract"'), 'Opening media must precede the abstract');
assert(html.includes('class="publication-header wrap"'), 'Expected academic publication header');
assert(!/class="(?:hero-heading|site-header|metrics)"/.test(html), 'Editorial masthead or hero metrics remain');
const hasVideo = existsSync(join(output, 'assets/teaser.mp4'));
if (hasVideo) {
  assert(/<video[^>]*\bcontrols\b[^>]*\bplaysinline\b/.test(html), 'Expected an accessible native video player');
  assert(html.includes('<source src="assets/teaser.mp4" type="video/mp4">'));
  assert(!html.includes('Video not yet provided'), 'Stale missing-video message');
} else {
  assert(html.includes('Video not yet provided'), 'Missing-video state must be explicit');
  assert(!/<video\b/.test(html), 'Do not present a broken or empty video player');
}
for (const text of [html, css, js]) {
  assert(!/github\.com|github\.io|youtube\.com|youtu\.be|fonts\.google|google-analytics|mailto:|\/home\/|\/Users\/|\.edu\b|sourceMappingURL|First Author|Second Author|TODO|81\.2|44\.55|TRIAD|morphology-conditioned realizer/i.test(text), 'Old content, identity, or external dependency found');
}
for (const number of ['92.40', '74.02', '0.16', '33.90', '19.40', '0.95', '68.20', '72.73', '80.40', '74.73', '13.647', '13.041', '0.606']) assert(html.includes(number), 'Missing current paper value ' + number);
const fsa = (13.4 + 45.2 + 9.2 + 67.8) / 4;
assert.equal(fsa.toFixed(2), '33.90');
assert.equal((10+10+9+9+7+5+8+8+10+8), 84);
assert.equal((9+8+9+6+5+4+8+6+8+5), 68);
assert.equal(((84+68)/200*100).toFixed(2), '76.00');
let total = 0;
function count(dir) { for (const entry of readdirSync(dir)) { const path = join(dir, entry); const stat = statSync(path); if (stat.isDirectory()) count(path); else { total++; assert(stat.size < 25 * 1024 * 1024, 'Asset exceeds direct-upload limit'); } } }
count(output);
assert.equal(total, hasVideo ? 13 : 12, 'Unexpected public artifact count');
console.log(`PASS: ${total} public files; opening media order, resource states, local links, anchors, image dimensions and metadata, current values, anonymity checks, and no third-party dependencies.`);
if (hasVideo) console.log('Video file presence checked; audiovisual content and binary metadata require a separate anonymity review.');
console.log('Static checks only. Public hosting, browser layout, and reviewer access require separate verification.');

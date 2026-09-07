import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const files = ['index.html', 'styles.css', 'site.js', 'favicon.svg', 'robots.txt', '_headers',
  'assets/grasps.png', 'assets/alignment.png', 'assets/method.png',
  'assets/ablation.png', 'assets/finger-length.png', 'assets/real-grasps.png'];
const output = join(root, 'dist');
const teaserFile = 'assets/teaser.mp4';
const hasTeaser = existsSync(join(root, teaserFile));
if (hasTeaser) {
  if (statSync(join(root, teaserFile)).size === 0) throw new Error('The project video is empty');
  files.push(teaserFile);
}

// Refuse unexpected old output; never silently ship extra source or identity files.
function inspect(dir, prefix = '') {
  for (const name of readdirSync(dir)) {
    const relative = prefix + name;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) inspect(path, relative + '/');
    else if (!files.includes(relative)) throw new Error('Unexpected output file: ' + relative);
  }
}
mkdirSync(output, { recursive: true });
inspect(output);
for (const file of files) {
  const target = join(output, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(root, file), target);
}
if (hasTeaser) {
  const page = readFileSync(join(output, 'index.html'), 'utf8');
  const player = `<figure class="project-video">
        <video id="project-video" controls playsinline preload="metadata" poster="assets/real-grasps.png" aria-label="FIRA-Grasp project overview video" aria-describedby="video-caption">
          <source src="assets/teaser.mp4" type="video/mp4">
          Your browser does not support HTML video. <a href="assets/teaser.mp4">Download the project video</a>.
        </video>
        <figcaption id="video-caption">FIRA-Grasp project overview.</figcaption>
      </figure>`;
  if (!page.includes('<!-- TEASER_START -->') || !page.includes('<!-- TEASER_END -->')) throw new Error('Missing video integration markers');
  writeFileSync(join(output, 'index.html'), page.replace(/<!-- TEASER_START -->[\s\S]*?<!-- TEASER_END -->/, player));
}
const hosting = JSON.parse(readFileSync(join(root, '.openai/hosting.json'), 'utf8'));
if (hosting.static.directory !== 'dist') throw new Error('Expected dist as the public directory');
console.log(`Built ${files.length} allowlisted public files. Source, configuration, and notes remain private.`);
console.log(hasTeaser ? 'Project video integrated with native controls.' : 'Video is not supplied: the opening media section explicitly shows manuscript stills.');

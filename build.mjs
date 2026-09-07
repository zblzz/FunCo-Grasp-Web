import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const files = ['index.html', 'styles.css', 'site.js', 'favicon.svg', 'robots.txt', '_headers',
  'assets/grasps.png', 'assets/alignment.png', 'assets/method.png',
  'assets/ablation.png', 'assets/finger-length.png', 'assets/real-grasps.png'];
const output = join(root, 'dist');

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
const hosting = JSON.parse(readFileSync(join(root, '.openai/hosting.json'), 'utf8'));
if (hosting.static.directory !== 'dist') throw new Error('Expected dist as the public directory');
console.log('Built 12 allowlisted public files. Source, configuration, and notes remain private.');

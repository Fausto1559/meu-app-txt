import { readdir } from 'node:fs/promises';
import path from 'node:path';

const apiRoot = path.resolve('api');
const MAX_FUNCTIONS = 12;
const ROUTE_EXTENSIONS = new Set([
  '.js',
  '.ts',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.rb',
  '.php',
]);

const functions = [];
const misplacedTests = [];

async function scan(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);

    // Vercel treats underscore-prefixed paths as private implementation files.
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await scan(absolutePath, relativePath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (/\.(test|spec)\.[^.]+$/i.test(entry.name)) {
      misplacedTests.push(relativePath);
    }

    if (entry.name.endsWith('.d.ts')) {
      continue;
    }

    if (ROUTE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      functions.push(relativePath);
    }
  }
}

try {
  await scan(apiRoot);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    console.error('Vercel function check failed: api/ directory does not exist.');
    process.exit(1);
  }
  throw error;
}

functions.sort();
misplacedTests.sort();

console.log(`Deployable API function candidates: ${functions.length}/${MAX_FUNCTIONS}`);
for (const file of functions) {
  console.log(`  - api/${file}`);
}

if (misplacedTests.length > 0) {
  console.error('Test/spec files must be outside routable api/ paths:');
  for (const file of misplacedTests) {
    console.error(`  - api/${file}`);
  }
  process.exitCode = 1;
}

if (functions.length > MAX_FUNCTIONS) {
  console.error(
    `Vercel Hobby limit exceeded: ${functions.length} function candidates; maximum is ${MAX_FUNCTIONS}.`
  );
  process.exitCode = 1;
}

if (process.exitCode !== 1) {
  console.log('Vercel function-count and route-hygiene check passed.');
}

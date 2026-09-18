// scripts/patch-prisma-wasm.js
// Makes Prisma's bundled WASM query engine loadable under plain Node.
// Only needed when running with DATABASE_ADAPTER=pg in environments where the
// native engine cannot be downloaded (CI sandboxes, locked-down servers).
// Run after `prisma generate`:  node scripts/patch-prisma-wasm.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const loader = path.join(dir, 'wasm-worker-loader.mjs');
if (!fs.existsSync(loader)) {
  console.log('[patch-prisma-wasm] generated client not found — run `prisma generate` first');
  process.exit(0);
}
fs.writeFileSync(loader, `import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const bytes = fs.readFileSync(path.join(here, 'query_engine_bg.wasm'));
export default WebAssembly.compile(bytes).then((mod) => ({ default: mod }));
`);
console.log('[patch-prisma-wasm] Node-compatible WASM loader installed');

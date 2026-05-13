import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.expo']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const roots = [path.join(root, 'src')];
let failed = false;

for (const base of roots) {
  for (const f of walk(base)) {
    if (!/\.(ts|tsx|js|mjs|cjs|json)$/.test(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('service_role')) {
      console.error('Forbidden service_role reference in:', path.relative(root, f));
      failed = true;
    }
  }
}

process.exit(failed ? 1 : 0);

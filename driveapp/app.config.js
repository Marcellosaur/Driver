/**
 * Loads env from monorepo root (`DriverApp/.env`) then `driveapp/.env` — local overrides parent.
 * Expo only auto-loads `.env` next to this file; parent `.env` is common in this repo layout.
 */
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

const driveappRoot = __dirname;
const repoRoot = path.join(driveappRoot, '..');
const merged = {
  ...parseEnvFile(path.join(repoRoot, '.env')),
  ...parseEnvFile(path.join(driveappRoot, '.env')),
};
for (const [k, v] of Object.entries(merged)) {
  process.env[k] = v;
}

if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAP_API_KEY) {
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAP_API_KEY;
}
if (!process.env.EXPO_PUBLIC_API_BASE_URL && process.env.EXPO_PUBLIC_API_URL) {
  process.env.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
}

module.exports = require('./app.json');

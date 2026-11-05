import { readFile } from 'node:fs/promises';
export function validateEntries(entries) {
  if (!Array.isArray(entries)) throw new Error('Entries must be an array');
  const ids = new Set();
  for (const e of entries) {
    if (!e || typeof e !== 'object' || !/^[a-z0-9-]+$/.test(e.id || '') || ids.has(e.id)) throw new Error('Each entry needs a unique lowercase id');
    ids.add(e.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || '') || !Number.isFinite(Date.parse(e.date)) || new Date(e.date).toISOString().slice(0,10) !== e.date) throw new Error('Invalid entry date');
    if (typeof e.title !== 'string' || !e.title.trim() || e.title.length > 160) throw new Error('Invalid title');
    if (typeof e.body !== 'string' || !e.body.trim() || e.body.length > 30000) throw new Error('Invalid body');
    if (typeof e.published !== 'boolean') throw new Error('Set published to true or false explicitly');
    if (e.mood !== undefined && (typeof e.mood !== 'string' || e.mood.length > 30)) throw new Error('Invalid mood');
  }
  return entries;
}
export async function loadEntries() {
  return validateEntries(JSON.parse(await readFile(new URL('../content/entries.json', import.meta.url), 'utf8')));
}

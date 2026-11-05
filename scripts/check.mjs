import { loadEntries } from '../lib/content.mjs';
const entries = await loadEntries();
console.log(`Content valid: ${entries.length} entries; ${entries.filter(e=>e.published).length} published.`);

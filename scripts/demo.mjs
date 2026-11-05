// Local-only, empty-content demo using the actual authentication server.
// Each launch generates an ephemeral password; nothing is saved or deployed.
import { randomBytes } from 'node:crypto';
import { createDiaryServer } from '../server.mjs';
if (process.env.NODE_ENV === 'production') throw new Error('The demo cannot run in production.');
const port = 3211;
const origin = `http://127.0.0.1:${port}`;
const password = `demo-${randomBytes(8).toString('hex')}`;
const server = await createDiaryServer({ password, origin, production: false, entries: [] });
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`Local-only demo (empty diary): ${origin}`);
  console.log(`Temporary demo password: ${password}`);
  console.log('This password is generated for this run, is not saved, and must never be used for a live diary.');
});

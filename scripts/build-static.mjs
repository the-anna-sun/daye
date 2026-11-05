import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { loadEntries } from '../lib/content.mjs';
import { login, diary } from '../lib/views.mjs';
const root = new URL('../', import.meta.url);
const out = new URL('docs/', root);
await mkdir(out, {recursive:true});
const entries = await loadEntries();
const diaryMain = diary(entries,'').match(/<main[\s\S]*<\/main>/)[0];
const html = login().replace('A LITTLE PRIVATE CORNER','A LITTLE EVERYDAY CORNER').replace('JUST BETWEEN US','FOR OUR FRIENDS').replace('href="/style.css"','href="./style.css"')
  .replace('href="/"','href="./"').replace('action="/login"','action="#"')
  .replace('Enter the password Anna shared with you to catch up on the little things.', 'A casual door for friends. This is a public site; the password screen does not protect its contents.')
  .replace('</body>', `<template id="diary-view">${diaryMain}</template><script src="./app.js" defer></script></body>`);
await writeFile(new URL('index.html',out), html);
await copyFile(new URL('public/style.css',root),new URL('style.css',out));
await copyFile(new URL('static/app.js',root),new URL('app.js',out));
await copyFile(new URL('static/config.json',root),new URL('config.json',out));
await writeFile(new URL('.nojekyll',out),'');
console.log('GitHub Pages site built in docs/. Only published entries are included; all included content is public.');

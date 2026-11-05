// An isolated, loopback-only design preview. Never imports diary content or auth.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {diary, login} from '../lib/views.mjs';
const css = await readFile(new URL('../public/style.css', import.meta.url));
createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/style.css'){res.setHeader('Content-Type','text/css; charset=utf-8');return res.end(css);}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if(req.url==='/') return res.end(diary([], '', true));
  if(req.url==='/login') return res.end(login('Design preview only. Use the local demo server to test the password.',true));
  res.statusCode=404;res.end('Not found');
}).listen(3210,'127.0.0.1',()=>console.log('Design preview: http://127.0.0.1:3210'));

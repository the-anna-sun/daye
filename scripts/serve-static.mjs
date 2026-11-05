import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import './build-static.mjs';
const allowed=new Map([['/','index.html'],['/index.html','index.html'],['/style.css','style.css'],['/app.js','app.js'],['/config.json','config.json']]);
createServer(async(req,res)=>{
  const path=new URL(req.url,'http://local').pathname;
  const file=allowed.get(path);
  if(req.method!=='GET'||!file){res.writeHead(404);return res.end('Not found');}
  const type=file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/html';
  res.setHeader('Content-Type',type+'; charset=utf-8');res.setHeader('Cache-Control','no-store');
  try{res.end(await readFile(new URL('../docs/'+file,import.meta.url)));}catch{res.writeHead(500);res.end('Unable to load preview.');}
}).listen(3211,'127.0.0.1',()=>console.log('Static diary demo: http://127.0.0.1:3211 — cosmetic password: little-days'));

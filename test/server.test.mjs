import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiaryServer} from '../server.mjs';
import {validateEntries} from '../lib/content.mjs';
const fixture = [{id:'older',date:'2026-01-01',title:'OLDER_TEST_ONLY',body:'hello',published:true},{id:'newer',date:'2026-02-01',title:'NEWER_TEST_ONLY',body:'<script>alert(1)</script>',published:true},{id:'draft',date:'2026-03-01',title:'SECRET_DRAFT',body:'private',published:false}];
async function setup(t, options={}) {
  const server = await createDiaryServer({password:'test-only-long-password',entries:fixture,...options});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const get=(path,opts)=>fetch(base+path,opts);
  const post=(path,data,extra={})=>get(path,{method:'POST',redirect:'manual',headers:{origin:base,'content-type':'application/x-www-form-urlencoded',...extra},body:new URLSearchParams(data)});
  return {get,post,base};
}
test('closed by default without a secret or HTTPS origin',async()=>{
  await assert.rejects(createDiaryServer({password:'',entries:[]}));
  await assert.rejects(createDiaryServer({password:'test-only-long-password',production:true,entries:[],origin:'http://example.com'}));
});
test('anonymous access cannot retrieve entries, drafts, source or secrets',async t=>{
  const {get}=await setup(t);
  const r=await get('/');const body=await r.text();assert.match(body,/Our shared password/);assert.doesNotMatch(body,/OLDER_TEST_ONLY|NEWER_TEST_ONLY|SECRET_DRAFT/);assert.match(r.headers.get('cache-control'),/no-store/);
  for(const path of ['/content/entries.json','/server.mjs','/.env','/.git/config','/public/../content/entries.json','/api/entries']) assert.equal((await get(path)).status,404);
  assert.doesNotMatch(await (await get('/',{headers:{cookie:'anna_session=forged'}})).text(),/NEWER_TEST_ONLY/);
});
test('password, sort, draft exclusion, escaping and logout invalidation',async t=>{
  const {get,post}=await setup(t);
  assert.equal((await post('/login',{password:'wrong'})).status,401);
  const r=await post('/login',{password:'test-only-long-password'});assert.equal(r.status,303);
  const set=r.headers.get('set-cookie');assert.match(set,/HttpOnly/);assert.match(set,/SameSite=Strict/);
  const cookie=set.split(';')[0];const text=await(await get('/',{headers:{cookie}})).text();
  assert.ok(text.indexOf('NEWER_TEST_ONLY')<text.indexOf('OLDER_TEST_ONLY'));assert.doesNotMatch(text,/SECRET_DRAFT|<script>/);assert.match(text,/&lt;script&gt;/);
  assert.equal((await post('/logout',{csrf:'wrong'},{cookie})).status,403);
  const csrf=text.match(/name="csrf" value="([^"]+)"/)[1];assert.equal((await post('/logout',{csrf},{cookie})).status,303);
  assert.doesNotMatch(await(await get('/',{headers:{cookie}})).text(),/NEWER_TEST_ONLY/);
});
test('cross-origin login denied and repeated attempts rate limited',async t=>{
  const {post}=await setup(t);assert.equal((await post('/login',{password:'test-only-long-password'},{origin:'https://evil.example'})).status,403);
  for(let i=0;i<8;i++) assert.equal((await post('/login',{password:'wrong'})).status,401);
  assert.equal((await post('/login',{password:'wrong'})).status,429);
});
test('production sessions use secure host-only cookies',async t=>{
  const {post}=await setup(t,{production:true,origin:'https://diary.example'});
  const r=await post('/login',{password:'test-only-long-password'},{origin:'https://diary.example'});
  assert.match(r.headers.get('set-cookie'),/^__Host-anna_session=.*; Secure$/);
});
test('entry validation rejects bad dates and duplicates',()=>{
  assert.throws(()=>validateEntries([{...fixture[0],date:'2026-02-30'}]));
  assert.throws(()=>validateEntries([fixture[0],fixture[0]]));
});

test('browser form policy and strict Origin/Referer validation', async t => {
  const {get,base}=await setup(t);
  assert.equal((await get('/')).headers.get('referrer-policy'),'same-origin');
  const submit=headers=>get('/login',{method:'POST',redirect:'manual',headers:{'content-type':'application/x-www-form-urlencoded',...headers},body:'password=wrong'});
  assert.equal((await submit({origin:base,'sec-fetch-mode':'navigate','sec-fetch-site':'same-origin'})).status,401);
  assert.equal((await submit({referer:base+'/'})).status,401);
  for(const headers of [{},{origin:'null',referer:base+'/'},{origin:'https://evil.example',referer:base+'/'},{referer:'https://evil.example/'},{referer:base+'.evil.example/'},{referer:'invalid'},{origin:'http://localhost:3211'},{origin:'https://evil.example','x-forwarded-host':'127.0.0.1','x-forwarded-proto':'http'}]) {
    assert.equal((await submit(headers)).status,403);
  }
});

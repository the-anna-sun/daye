// Cosmetic gate only. Both the password and published entries are public.
const gate = document.querySelector('main');
const form = gate.querySelector('form');
const button = form.querySelector('button');
const input = form.querySelector('input');
let view;
function notice(message) {
  let box = gate.querySelector('[role="alert"]');
  if (!box) { box=document.createElement('p'); box.className='notice'; box.setAttribute('role','alert'); form.before(box); }
  box.textContent=message;
}
function openDiary() {
  view=document.querySelector('#diary-view').content.firstElementChild.cloneNode(true);
  gate.replaceWith(view);
  view.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault(); view.replaceWith(gate); input.value=''; input.focus();
  });
  const heading=view.querySelector('h1'); heading.tabIndex=-1; heading.focus();
}
button.disabled=true;
fetch('./config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(config=>{
  if(typeof config.password!=='string')throw new Error();
  button.disabled=false;
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(input.value!==config.password){notice('That password doesn’t look right. Give it another try.');input.focus();return;}
    gate.querySelector('[role="alert"]')?.remove(); openDiary();
  });
}).catch(()=>notice('Could not load the demo. Open it using the local website link, then refresh.'));

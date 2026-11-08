const toggle=document.querySelector<HTMLButtonElement>('#menu-toggle');
const nav=document.querySelector<HTMLElement>('#navigation');
if(toggle && nav){
const closeMenu=()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');};
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';closeMenu();if(!open){toggle.setAttribute('aria-expanded','true');nav.classList.add('open');nav.querySelector<HTMLElement>('a')?.focus();}});
document.addEventListener('keydown',e=>{if(toggle.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){closeMenu();toggle.focus();}if(e.key==='Tab'){const nodes=[toggle,...nav.querySelectorAll<HTMLElement>('a,summary')].filter(n=>n.getClientRects().length>0);const index=nodes.indexOf(document.activeElement as HTMLElement);e.preventDefault();nodes[(index+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();}});
matchMedia('(min-width: 1050px)').addEventListener('change',closeMenu);
}
document.querySelector('#theme')?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('atlas-theme',next)}catch{}});

const searchToggle=document.querySelector<HTMLButtonElement>('#search-toggle');searchToggle?.addEventListener('click',()=>{const open=searchToggle.getAttribute('aria-expanded')!=='true';searchToggle.setAttribute('aria-expanded',String(open));document.querySelector('#platform-search')?.classList.toggle('search-open',open);if(open)document.querySelector<HTMLInputElement>('#global-search')?.focus();});

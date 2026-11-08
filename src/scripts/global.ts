document.addEventListener('astro:page-load',()=>{
const lifecycle=new AbortController();document.addEventListener('astro:before-swap',()=>lifecycle.abort(),{once:true});
const toggle=document.querySelector<HTMLButtonElement>('#menu-toggle');
const nav=document.querySelector<HTMLElement>('#navigation');
if(toggle && nav){
const closeMenu=()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');};
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';closeMenu();if(!open){toggle.setAttribute('aria-expanded','true');nav.classList.add('open');nav.querySelector<HTMLElement>('a')?.focus();}});
document.addEventListener('keydown',e=>{if(toggle.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){closeMenu();toggle.focus();}if(e.key==='Tab'){const nodes=[toggle,...nav.querySelectorAll<HTMLElement>('a,summary')].filter(n=>n.getClientRects().length>0);const index=nodes.indexOf(document.activeElement as HTMLElement);e.preventDefault();nodes[(index+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();}},{signal:lifecycle.signal});
matchMedia('(min-width: 1050px)').addEventListener('change',closeMenu,{signal:lifecycle.signal});
}
const theme=document.querySelector<HTMLButtonElement>('#theme');if(theme)theme.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('atlas-theme',next)}catch{}};

const searchToggle=document.querySelector<HTMLButtonElement>('#search-toggle');if(searchToggle)searchToggle.onclick=()=>{const open=searchToggle.getAttribute('aria-expanded')!=='true';searchToggle.setAttribute('aria-expanded',String(open));document.querySelector('#platform-search')?.classList.toggle('search-open',open);if(open)document.querySelector<HTMLInputElement>('#global-search')?.focus();};

if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target as HTMLElement;const target=el.dataset.count!;const numeric=target.replace(/[^0-9,]/g,'').replace(',','.');const n=Number(numeric);if(Number.isFinite(n)){const start=performance.now();const tick=(now:number)=>{const ratio=Math.min(1,(now-start)/700);el.textContent=ratio===1?target:target.replace(/[0-9]+(?:,[0-9]+)?/, (n*ratio).toLocaleString('pt-BR',{maximumFractionDigits:target.includes(',')?1:0}));if(ratio<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}observer.unobserve(el)})});document.querySelectorAll('[data-count]').forEach(el=>{if((el as HTMLElement).dataset.count)observer.observe(el)});document.addEventListener('astro:before-swap',()=>observer.disconnect(),{once:true})}
});

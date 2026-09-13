const dialog = document.querySelector('#figure-dialog');
const image = document.querySelector('#dialog-image');
let trigger = null;

// A missing or broken bootstrap must not leave the initial loading note forever.
function galleryFallback() {
  const gallery = document.querySelector('#grasp-gallery-rows');
  if (!gallery || gallery.querySelector('.gallery-stage, .gallery-reload')) return;
  const note = document.createElement('p');
  note.className = 'loading-note'; note.setAttribute('role', 'status');
  note.textContent = 'The interactive gallery could not start. Please reload the page.';
  const reload = document.createElement('button');
  reload.type = 'button'; reload.className = 'gallery-reload reset-view';
  reload.textContent = 'Reload page';
  reload.addEventListener('click', () => location.reload());
  note.append(document.createElement('br'), reload);
  gallery.replaceChildren(note);
}
document.addEventListener('DOMContentLoaded', galleryFallback, {once:true});
setTimeout(galleryFallback, 30000);

if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-lightbox]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      document.querySelector('#dialog-caption').textContent = image.alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus());
}

// Section navigation and subtle, one-time entrances. All content remains visible
// if JavaScript is unavailable; no permanent rendering loop or external library.
const menu = document.querySelector('.mobile-nav');
const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
const sections = [...new Set(sectionLinks.map(link => link.hash))].map(hash => document.querySelector(hash)).filter(Boolean);
const progress = document.querySelector('.reading-progress');
let navigationQueued = false;
function updateNavigation() {
  navigationQueued = false;
  let active = '';
  for (const section of sections) if (section.getBoundingClientRect().top <= 145) active = '#'+section.id;
  // A short final section may never reach the header offset before the page ends.
  if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2 && sections.length) active = '#'+sections.at(-1).id;
  for (const link of sectionLinks) {
    if (link.hash === active) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  }
  const length = document.documentElement.scrollHeight-innerHeight;
  if (progress) progress.value = length > 0 ? Math.min(100,Math.max(0,scrollY/length*100)) : 0;
}
function queueNavigation() {
  if (!navigationQueued) { navigationQueued = true; requestAnimationFrame(updateNavigation); }
}
addEventListener('scroll',queueNavigation,{passive:true});
addEventListener('resize',queueNavigation,{passive:true});
addEventListener('load',queueNavigation,{once:true});
queueNavigation();
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{ menu.open=false; }));
menu?.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}
});
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const entrance = new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('has-entered');entrance.unobserve(entry.target);}
  },{threshold:.06});
  document.querySelectorAll('.paper-figure,.results-table-block,.real-videos,.grasp-gallery').forEach(node=>entrance.observe(node));
}

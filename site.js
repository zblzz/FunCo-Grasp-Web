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

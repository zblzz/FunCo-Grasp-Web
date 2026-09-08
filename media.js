// Shared by the repository page and the local build: no generated-only player.
const mediaRelease = new URL(document.currentScript.src).search;
fetch('media.json' + mediaRelease).then(response => {
  if (!response.ok) throw new Error('Media configuration unavailable');
  return response.json();
}).then(config => {
  document.querySelectorAll('[data-media]').forEach(slot => {
    const entry = config[slot.dataset.media];
    if (!entry?.src) return;
    const url = new URL(entry.src, document.baseURI);
    if (url.origin !== location.origin) throw new Error('Media must be hosted with the project');
    url.search = mediaRelease;
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', entry.label);
    // Match the real-world MP4 loops in the reference, while retaining controls.
    if (slot.dataset.media !== 'teaser') {
      video.muted = true;
      video.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    const source = document.createElement('source');
    source.src = url.href;
    source.type = 'video/mp4';
    source.addEventListener('error', () => { slot.replaceChildren(Object.assign(document.createElement('p'), {textContent:'Video could not be loaded.'})); });
    video.append(source);
    slot.replaceChildren(video);
    slot.setAttribute('aria-label', entry.label);
  });
}).catch(error => console.warn(error.message));

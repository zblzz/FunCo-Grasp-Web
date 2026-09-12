// Shared by the repository page and the local build: no generated-only player.
try {
  const config = JSON.parse(document.querySelector('#media-config').textContent);
  document.querySelectorAll('[data-media]').forEach(slot => {
    const entry = config[slot.dataset.media];
    if (!entry?.src) return;
    const url = new URL(entry.src, document.baseURI);
    if (url.origin !== new URL(document.baseURI).origin) throw new Error('Media must be hosted with the project');
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.loop = entry.loop;
    video.muted = entry.muted;
    video.preload = entry.preload;
    if(entry.poster) video.poster = new URL(entry.poster, document.baseURI).href;
    video.setAttribute('aria-label', entry.label);
    // Match the real-world MP4 loops in the reference, while retaining controls.
    if (entry.autoplay && entry.muted) {
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
} catch (error) { console.warn(error.message); }

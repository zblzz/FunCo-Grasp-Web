// Small, independent UI: Three.js never blocks the object/grasp controls.
(() => {
'use strict';
const root = document.querySelector('#grasp-gallery-rows');
const catalog = JSON.parse(document.querySelector('#grasp-catalog').textContent);
const siteBase = new URL('../', document.currentScript.src);
const dataBase = new URL(catalog.dataRoot, siteBase);
const pending = new Map();
const scripts = new Map();
const attempts = new Map();
const received = new Map();
const timeoutMs = 30000;
// The host intentionally gives documents an opaque origin. Classic scripts are
// permitted by that sandbox; module imports and cross-origin fetch are not.
// Only generated, versioned, local project payloads can be registered here.
const payloadKeys = new Set(Object.values(catalog.payloads).map(entry => entry.key));
window.FIRAGraspAssets = Object.freeze({register(key, payload) {
  if (payloadKeys.has(key) && typeof payload === 'string') received.set(key, payload);
}});
function loadClassic(path, base, ready) {
  const original = new URL(path, base).href;
  if (!scripts.has(original)) {
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const url = new URL(original);
      const attempt = attempts.get(original) || 0;
      if (attempt) url.searchParams.set('retry', String(attempt));
      script.async = true;
      script.src = url.href;
      function finish(error) {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        if (error) reject(error);
        else { try { resolve(ready()); } catch (failure) { reject(failure); } }
      }
      const timer = setTimeout(() => finish(new Error('Grasp resource timed out')), timeoutMs);
      script.onerror = () => finish(new Error('Grasp resource unavailable'));
      script.onload = () => finish();
      document.head.append(script);
    });
    scripts.set(original, promise);
    promise.catch(() => { scripts.delete(original); attempts.set(original, (attempts.get(original) || 0) + 1); });
  }
  return scripts.get(original);
}
const metrics = {uiMs:null, firstModelMs:null, allModelsMs:null};
function record() {
  const ready = [...root.querySelectorAll('.grasp-card')].filter(card => card.dataset.ready === 'true').length;
  const now = Math.round(performance.now());
  if (ready && metrics.firstModelMs === null) metrics.firstModelMs = now;
  if (ready === catalog.hands.length && metrics.allModelsMs === null) metrics.allModelsMs = now;
  root.dataset.performance = JSON.stringify({...metrics, ready});
}
function readAsset(path, type) {
  const key = type + ':' + path;
  if (!pending.has(key)) {
    const entry = catalog.payloads[path];
    if (!entry) return Promise.reject(new Error('Grasp resource is not listed'));
    if (typeof DecompressionStream !== 'function') return Promise.reject(new Error('Please use an up-to-date browser'));
    const promise = loadClassic(entry.src, dataBase, () => {
      const payload = received.get(entry.key);
      if (!payload) throw new Error('Grasp payload was not registered');
      received.delete(entry.key);
      return payload;
    }).then(async payload => {
      const text = atob(payload);
      const bytes = new Uint8Array(text.length);
      for (let i=0;i<text.length;i++) bytes[i] = text.charCodeAt(i);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      // This Response wraps an in-memory stream; it performs no network request.
      const buffer = await new Response(stream).arrayBuffer();
      if (buffer.byteLength !== entry.bytes) throw new Error('Incomplete grasp payload');
      // The decoded asset is cached below; release the compressed script value.
      scripts.delete(new URL(entry.src, dataBase).href);
      return type === 'json' ? JSON.parse(new TextDecoder().decode(buffer)) : buffer;
    });
    pending.set(key, promise);
    promise.catch(() => { pending.delete(key); scripts.delete(new URL(entry.src, dataBase).href); });
  }
  return pending.get(key);
}
const displayPoses = new Map();
const assets = {
  binary:path => readAsset(path, 'binary'),
  pose:(hand, object, index) => {
    if (object.id === catalog.initialObject && index === catalog.initialGrasp) return Promise.resolve(hand.initialPose);
    const key = hand.id + ':' + object.id;
    if (!displayPoses.has(key)) {
      const promise = readAsset(hand.poses[object.id], 'json').then(batch => ({
        ...batch, grasps:hand.poseOrder[object.id].map(i => batch.grasps[i])
      }));
      displayPoses.set(key, promise);
      promise.catch(() => displayPoses.delete(key));
    }
    return displayPoses.get(key);
  }
};
function engine() {
  return loadClassic(catalog.engine, siteBase, () => {
    if (!window.FIRAGraspEngine?.GraspView) throw new Error('3D engine is unavailable');
    return window.FIRAGraspEngine;
  });
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
class GraspCard {
  constructor(hand) {
    this.hand = hand;
    this.card = element('figure', 'grasp-card');
    this.card.dataset.hand = hand.id;
    this.card.dataset.ready = 'false';
    this.viewport = element('div', 'grasp-viewport');
    this.preview = element('img', 'grasp-preview');
    if (hand.preview) this.preview.src = new URL(hand.preview, siteBase).href;
    else this.preview.hidden = true;
    this.preview.alt = `${hand.label}, ${catalog.objects.find(o => o.id === catalog.initialObject).label}, grasp ${catalog.initialGrasp+1} — static preview while the interactive model loads.`;
    this.preview.width = 329; this.preview.height = 295;
    this.preview.loading = 'lazy'; this.preview.decoding = 'async'; this.preview.fetchPriority = 'low';
    this.status = element('span', 'grasp-status', 'Loading 3D…');
    this.status.setAttribute('role', 'status');
    this.retry = element('button', 'grasp-retry', 'Retry 3D');
    this.retry.type = 'button'; this.retry.hidden = true;
    this.retry.addEventListener('click', () => this.update(this.object, this.index));
    this.viewport.append(this.preview, this.status, this.retry);
    this.card.append(element('figcaption', '', hand.label), this.viewport);
    this.sequence = 0;
  }
  async update(object, index) {
    this.object = object; this.index = index;
    const request = ++this.sequence;
    this.card.dataset.ready = 'false';
    this.viewport.setAttribute('aria-busy', 'true');
    this.status.hidden = false; this.status.textContent = 'Loading 3D…';
    this.retry.hidden = true;
    // The preview is the actual default selection, never a different object/pose.
    this.preview.hidden = !this.hand.preview || object.id !== catalog.initialObject || index !== catalog.initialGrasp;
    try {
      const [module] = await Promise.all([
        engine(), ...this.hand.geometry.map(assets.binary),
        assets.binary(object.geometry), assets.pose(this.hand, object, index)
      ]);
      if (request !== this.sequence) return;
      if (!this.view) this.view = new module.GraspView(this.hand, this.viewport, assets);
      await this.view.update(object, index);
      if (request !== this.sequence) return;
      this.preview.hidden = true;
      this.status.hidden = true;
      this.card.dataset.ready = 'true';
      this.card.dataset.object = object.id;
      this.card.dataset.grasp = String(index);
      record();
    } catch (error) {
      if (request !== this.sequence) return;
      this.status.textContent = typeof DecompressionStream !== 'function'
        ? 'Please update your browser to load the 3D view.'
        : '3D could not load. Check your connection or WebGL support.';
      this.retry.hidden = false;
      console.warn(error.message);
    } finally {
      if (request === this.sequence) this.viewport.setAttribute('aria-busy', 'false');
    }
  }
  frame() { this.view?.frame(); }
}

function createRow(catalog, split, title, selection) {
  const row = element('section', 'grasp-row');
  row.setAttribute('aria-label', title);
  row.dataset.split = split;
  row.append(element('h4','',title));
  const grid = element('div','grasp-grid');
  const views = catalog.hands.filter(hand => hand.split === split).map(hand => new GraspCard(hand));
  views.forEach(view => grid.append(view.card));
  row.append(grid);
  let active = false;
  function update() {
    if (!active) return;
    views.forEach(view => view.update(selection.object, selection.index));
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { active = true; update(); observer.disconnect(); }
  }, {rootMargin:'250px'});
  observer.observe(row);
  return {node:row, update, reset:() => views.forEach(view => view.frame())};
}

function createGallery(catalog) {
  const selection = {object:catalog.objects.find(o => o.id === catalog.initialObject), index:catalog.initialGrasp};
  const gallery = element('div', 'gallery-stage');
  const objectBar = element('div', 'object-bar');
  const objectLabel = element('label', 'control-label', 'Object');
  objectLabel.htmlFor = 'gallery-object';
  const picker = element('div', 'object-picker');
  const objects = element('select', 'object-select');
  objects.id = 'gallery-object';
  catalog.objects.forEach(object => {
    const option = element('option', '', object.label); option.value = object.id;
    objects.append(option);
  });
  objects.addEventListener('change', () => { selection.object = catalog.objects.find(o => o.id === objects.value); update(); });
  const objectPrevious = element('button', 'object-step', '←');
  const objectNext = element('button', 'object-step', '→');
  for (const [button, label, step] of [[objectPrevious, 'Previous object', -1], [objectNext, 'Next object', 1]]) {
    button.type = 'button'; button.setAttribute('aria-label', label);
    button.disabled = catalog.objects.length === 1;
    button.addEventListener('click', () => {
      selection.object = catalog.objects[(catalog.objects.indexOf(selection.object)+step+catalog.objects.length)%catalog.objects.length]; update();
    });
  }
  const objectCount = element('span', 'object-count'); objectCount.setAttribute('aria-hidden', 'true');
  picker.append(objectPrevious, objects, objectNext);
  objectBar.append(objectLabel, picker, objectCount);

  const rows = [['seen','Seen embodiments'],['unseen','Unseen embodiments']]
    .filter(([split]) => catalog.hands.some(hand => hand.split === split))
    .map(([split,title]) => createRow(catalog,split,title,selection));
  const navigation = element('div', 'grasp-bar');
  const label = element('span', 'control-label', 'Grasp'); label.id = 'gallery-grasp-label';
  const numbers = element('div','grasp-options');
  numbers.setAttribute('role','group'); numbers.setAttribute('aria-labelledby',label.id);
  const previous = element('button','grasp-step','←'); previous.type = 'button'; previous.setAttribute('aria-label','Previous grasp');
  const next = element('button','grasp-step','→'); next.type = 'button'; next.setAttribute('aria-label','Next grasp');
  const graspButtons = Array.from({length:catalog.graspCount}, (_,index) => {
    const button = element('button','grasp-choice',String(index+1).padStart(2,'0'));
    button.type = 'button'; button.setAttribute('aria-label',`Grasp ${index+1} of ${catalog.graspCount}`);
    button.addEventListener('click',() => { selection.index = index; update(); });
    return button;
  });
  numbers.append(previous,...graspButtons,next);
  previous.addEventListener('click',() => { selection.index = (selection.index+catalog.graspCount-1)%catalog.graspCount; update(); });
  next.addEventListener('click',() => { selection.index = (selection.index+1)%catalog.graspCount; update(); });
  const reset = element('button','reset-view','Reset views'); reset.type = 'button';
  reset.addEventListener('click',() => rows.forEach(row => row.reset()));
  navigation.append(label,numbers,reset);
  const announcement = element('span','sr-only'); announcement.setAttribute('role','status');
  function update() {
    objects.value = selection.object.id;
    objectCount.textContent = `${String(catalog.objects.indexOf(selection.object)+1).padStart(2,'0')} / ${String(catalog.objects.length).padStart(2,'0')}`;
    graspButtons.forEach((button,index) => button.setAttribute('aria-pressed',String(index === selection.index)));
    announcement.textContent = `${selection.object.label}, grasp ${selection.index+1} of ${catalog.graspCount}, across ${catalog.hands.length} embodiments.`;
    rows.forEach(row => row.update());
  }
  gallery.append(objectBar,navigation,...rows.map(row => row.node),announcement);
  update();
  return gallery;
}

root.replaceChildren(createGallery(catalog));
metrics.uiMs = Math.round(performance.now());
record();
})();

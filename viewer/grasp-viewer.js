// Small, independent UI: Three.js never blocks the object/grasp controls.
const root = document.querySelector('#grasp-gallery-rows');
const catalog = JSON.parse(document.querySelector('#grasp-catalog').textContent);
const dataBase = new URL('../grasps/', import.meta.url);
const pending = new Map();
const timeoutMs = 30000;
const metrics = {uiMs:null, firstModelMs:null, allModelsMs:null};
function record() {
  const ready = [...root.querySelectorAll('.grasp-card')].filter(card => card.dataset.ready === 'true').length;
  const now = Math.round(performance.now());
  if (ready && metrics.firstModelMs === null) metrics.firstModelMs = now;
  if (ready === 6 && metrics.allModelsMs === null) metrics.allModelsMs = now;
  root.dataset.performance = JSON.stringify({...metrics, ready});
}
function fetchAsset(path, type) {
  const key = type + ':' + path;
  if (!pending.has(key)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const promise = fetch(new URL(path, dataBase), {signal:controller.signal}).then(response => {
      if (!response.ok) throw new Error('Grasp resource unavailable');
      return type === 'json' ? response.json() : response.arrayBuffer();
    }).finally(() => clearTimeout(timer));
    pending.set(key, promise);
    promise.catch(() => pending.delete(key));
  }
  return pending.get(key);
}
const assets = {
  binary:path => fetchAsset(path, 'binary'),
  pose:(hand, object, index) => object.id === catalog.objects[0].id && index === 0
    ? Promise.resolve(hand.initialPose) : fetchAsset(hand.poses[object.id], 'json')
};
let enginePromise;
let engineAttempt = 0;
function engine() {
  if (!enginePromise) {
    const url = new URL(catalog.engine, new URL('../', import.meta.url));
    if (engineAttempt++) url.searchParams.set('retry', String(engineAttempt));
    let timer;
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('3D engine timed out')), timeoutMs); });
    enginePromise = Promise.race([import(url.href), deadline])
      .finally(() => clearTimeout(timer)).catch(error => { enginePromise = null; throw error; });
  }
  return enginePromise;
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
    if (hand.preview) this.preview.src = new URL(hand.preview, dataBase).href;
    else this.preview.hidden = true;
    this.preview.alt = `${hand.label}, Apple, grasp 1 — static preview while the interactive model loads.`;
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
    this.preview.hidden = !this.hand.preview || object.id !== catalog.objects[0].id || index !== 0;
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
      this.status.textContent = '3D could not load. Check your connection or WebGL support.';
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
  const selection = {object:catalog.objects[0], index:0};
  const gallery = element('div', 'gallery-stage');
  const objectBar = element('div', 'object-bar');
  const objectLabel = element('span', 'control-label', 'Object');
  objectLabel.id = 'gallery-object-label';
  const objects = element('div', 'object-options');
  objects.setAttribute('role', 'group'); objects.setAttribute('aria-labelledby', objectLabel.id);
  const objectButtons = catalog.objects.map(object => {
    const button = element('button', 'object-choice', object.label);
    button.type = 'button'; button.dataset.object = object.id;
    button.addEventListener('click', () => { selection.object = object; update(); });
    objects.append(button); return button;
  });
  objectBar.append(objectLabel, objects);

  const rows = [createRow(catalog,'seen','Seen embodiments',selection), createRow(catalog,'unseen','Unseen embodiments',selection)];
  const navigation = element('div', 'grasp-bar');
  const label = element('span', 'control-label', 'Grasp'); label.id = 'gallery-grasp-label';
  const numbers = element('div','grasp-options');
  numbers.setAttribute('role','group'); numbers.setAttribute('aria-labelledby',label.id);
  const previous = element('button','grasp-step','←'); previous.type = 'button'; previous.setAttribute('aria-label','Previous grasp');
  const next = element('button','grasp-step','→'); next.type = 'button'; next.setAttribute('aria-label','Next grasp');
  const graspButtons = Array.from({length:10}, (_,index) => {
    const button = element('button','grasp-choice',String(index+1).padStart(2,'0'));
    button.type = 'button'; button.setAttribute('aria-label',`Grasp ${index+1} of 10`);
    button.addEventListener('click',() => { selection.index = index; update(); });
    return button;
  });
  numbers.append(previous,...graspButtons,next);
  previous.addEventListener('click',() => { selection.index = (selection.index+9)%10; update(); });
  next.addEventListener('click',() => { selection.index = (selection.index+1)%10; update(); });
  const reset = element('button','reset-view','Reset views'); reset.type = 'button';
  reset.addEventListener('click',() => rows.forEach(row => row.reset()));
  navigation.append(label,numbers,reset);
  const announcement = element('span','sr-only'); announcement.setAttribute('role','status');
  function update() {
    objectButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.object === selection.object.id)));
    graspButtons.forEach((button,index) => button.setAttribute('aria-pressed',String(index === selection.index)));
    announcement.textContent = `${selection.object.label}, grasp ${selection.index+1} of 10, across six embodiments.`;
    rows.forEach(row => row.update());
  }
  gallery.append(objectBar,...rows.map(row => row.node),navigation,announcement);
  update();
  return gallery;
}

root.replaceChildren(createGallery(catalog));
metrics.uiMs = Math.round(performance.now());
record();

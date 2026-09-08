import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

const dataBase = new URL('../grasps/', import.meta.url);
const releaseQuery = new URL(import.meta.url).search;
function dataURL(path) {
  const url = new URL(path, dataBase);
  url.search = releaseQuery;
  return url;
}
const loader = new GLTFLoader();
const geometryCache = new Map();
const poseCache = new Map();
const root = document.querySelector('#grasp-gallery-rows');

async function readJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${new URL(url).pathname.split('/').pop()}`);
  return response.json();
}
function geometry(path) {
  if (!geometryCache.has(path)) geometryCache.set(path, loader.loadAsync(dataURL(path).href));
  return geometryCache.get(path);
}
function poses(path) {
  if (!poseCache.has(path)) poseCache.set(path, readJSON(dataURL(path)));
  return poseCache.get(path);
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

class GraspView {
  constructor(hand) {
    this.hand = hand;
    this.card = element('figure', 'grasp-card');
    this.card.dataset.hand = hand.id;
    this.viewport = element('div', 'grasp-viewport');
    this.status = element('span', 'grasp-status', 'Loading 3D view…');
    this.viewport.append(this.status);
    const caption = element('figcaption', '', hand.label);
    this.card.append(caption, this.viewport);
    this.sequence = 0;
  }
  async initialize() {
    this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${this.hand.label} interactive grasp. Drag or use arrow keys to rotate; scroll or use plus and minus to zoom.`);
    this.viewport.prepend(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.001, 100);
    this.camera.up.set(0,0,1);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enablePan = false;
    this.controls.minDistance = 0.04;
    this.controls.maxDistance = 3;
    this.controls.addEventListener('change', () => this.render());
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x87909c, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(1,-2,3); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1.5);
    fill.position.set(-2,1,1); this.scene.add(fill);
    this.handGroup = new THREE.Group();
    this.scene.add(this.handGroup);
    this.objectMaterial = new THREE.MeshStandardMaterial({color:'#5c8ed8',roughness:.72,metalness:0});
    const material = new THREE.MeshStandardMaterial({color:this.hand.color, roughness:0.68, metalness:0.04});
    for (const asset of await Promise.all(this.hand.geometry.map(geometry))) {
      const model = asset.scene.clone(true);
      model.traverse(node => { if (node.isMesh) node.material = material; });
      this.handGroup.add(model);
    }
    this.resizeObserver = new ResizeObserver(() => {
      const width = this.viewport.clientWidth, height = this.viewport.clientHeight;
      if (!width || !height) return;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width/height;
      this.camera.updateProjectionMatrix();
      if (this.objectGroup) this.frame();
    });
    this.resizeObserver.observe(this.viewport);
    canvas.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key)) return;
      event.preventDefault();
      const offset = this.camera.position.clone().sub(this.controls.target);
      if (event.key === '+' || event.key === '=') offset.multiplyScalar(.9);
      else if (event.key === '-') offset.multiplyScalar(1.1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') offset.applyAxisAngle(this.camera.up, event.key === 'ArrowLeft' ? .12 : -.12);
      else {
        const right = new THREE.Vector3().crossVectors(offset, this.camera.up).normalize();
        offset.applyAxisAngle(right, event.key === 'ArrowUp' ? .08 : -.08);
      }
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    });
  }
  async update(object, index) {
    const request = ++this.sequence;
    this.status.hidden = false;
    this.status.textContent = 'Loading 3D view…';
    try {
      if (!this.ready) this.ready = this.initialize();
      await this.ready;
      const [asset, batch] = await Promise.all([geometry(object.geometry), poses(this.hand.poses[object.id])]);
      if (request !== this.sequence) return;
      const grasp = batch.grasps[index];
      if (!grasp || grasp.success !== true) throw new Error('Selected successful grasp is unavailable');
      if (this.objectId !== object.id) {
        if (this.objectGroup) this.scene.remove(this.objectGroup);
        this.objectGroup = asset.scene.clone(true);
        this.objectGroup.traverse(node => { if (node.isMesh) node.material = this.objectMaterial; });
        this.scene.add(this.objectGroup);
        this.objectId = object.id;
      }
      batch.links.forEach((name, i) => {
        const node = this.handGroup.getObjectByName(name);
        if (!node) throw new Error(`Missing geometry for ${name}`);
        // Exported FK matrices are row-major; Three.js stores column-major.
        node.matrixAutoUpdate = false;
        node.matrix.fromArray(grasp.matrices[i]).transpose();
        node.matrixWorldNeedsUpdate = true;
      });
      this.frame();
      this.status.hidden = true;
    } catch (error) {
      if (request !== this.sequence) return;
      this.status.textContent = '3D view unavailable. Reload the page or try a WebGL-enabled browser.';
      this.status.hidden = false;
      console.warn(error);
    }
  }
  frame() {
    if (!this.objectGroup) return;
    this.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.handGroup).union(new THREE.Box3().setFromObject(this.objectGroup));
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(this.camera.fov)/2;
    const horizontal = Math.atan(Math.tan(vertical)*this.camera.aspect);
    const distance = sphere.radius / Math.sin(Math.min(vertical,horizontal)) * 1.12;
    this.controls.target.copy(sphere.center);
    this.camera.position.copy(sphere.center).add(new THREE.Vector3(1.5,-1.5,1).normalize().multiplyScalar(distance));
    this.camera.lookAt(sphere.center);
    this.controls.update();
    this.render();
  }
  render() { if (this.renderer) this.renderer.render(this.scene, this.camera); }
}

function createRow(catalog, split, title, selection) {
  const row = element('section', 'grasp-row');
  row.setAttribute('aria-label', title);
  row.dataset.split = split;
  row.append(element('h4','',title));
  const grid = element('div','grasp-grid');
  const views = catalog.hands.filter(hand => hand.split === split).map(hand => new GraspView(hand));
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

readJSON(dataURL('catalog.json')).then(catalog => {
  root.replaceChildren(createGallery(catalog));
}).catch(error => {
  root.replaceChildren(element('p','loading-note','The interactive grasp data could not be loaded. Please reload the page.'));
  console.warn(error);
});

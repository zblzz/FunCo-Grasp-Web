// Bundled locally with the self-hosted Three.js dependencies; no runtime CDN.
import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

const loader = new GLTFLoader();
const decoded = new Map();
let sharedRenderer;
function renderer() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    sharedRenderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    sharedRenderer.setClearColor(0xffffff, 0);
    sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1.25;
  }
  return sharedRenderer;
}
function geometry(path, assets) {
  if (!decoded.has(path)) {
    const promise = assets.binary(path).then(buffer => loader.parseAsync(buffer, ''));
    decoded.set(path, promise);
    promise.catch(() => decoded.delete(path));
  }
  return decoded.get(path);
}

export class GraspView {
  constructor(hand, viewport, assets) {
    this.hand = hand;
    this.viewport = viewport;
    this.assets = assets;
    this.sequence = 0;
  }
  async initialize() {
    // Finish downloads before allocating a WebGL context, including on retry.
    const models = await Promise.all(this.hand.geometry.map(path => geometry(path, this.assets)));
    this.controls?.dispose();
    this.resizeObserver?.disconnect();
    this.viewport.querySelector('canvas')?.remove();
    // One GPU context/shader cache, six independent scene/camera/control pairs.
    // Copy each completed frame into its own canvas; no continuous render loop.
    this.renderer = renderer();
    const canvas = this.canvas = document.createElement('canvas');
    this.context = canvas.getContext('2d', {alpha:true});
    if (!this.context) throw new Error('Canvas is unavailable');
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
    for (const asset of models) {
      const model = asset.scene.clone(true);
      model.traverse(node => { if (node.isMesh) node.material = material; });
      this.handGroup.add(model);
    }
    this.resizeObserver = new ResizeObserver(() => {
      const width = this.viewport.clientWidth, height = this.viewport.clientHeight;
      if (!width || !height) return;
      this.width = width; this.height = height;
      canvas.width = Math.floor(width * this.renderer.getPixelRatio());
      canvas.height = Math.floor(height * this.renderer.getPixelRatio());
      this.camera.aspect = width/height;
      this.camera.updateProjectionMatrix();
      if (this.objectGroup) this.frame();
    });
    this.resizeObserver.observe(this.viewport);
    // Establish the correct dimensions before the first model is declared ready.
    this.width = this.viewport.clientWidth; this.height = this.viewport.clientHeight;
    canvas.width = Math.floor(this.width * this.renderer.getPixelRatio());
    canvas.height = Math.floor(this.height * this.renderer.getPixelRatio());
    this.camera.aspect = this.viewport.clientWidth / this.viewport.clientHeight;
    this.camera.updateProjectionMatrix();
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
    if (!this.ready) this.ready = this.initialize().catch(error => { this.ready = null; throw error; });
    // No hand -> object -> pose waterfall; all resources begin together.
    const [, asset, batch] = await Promise.all([
      this.ready, geometry(object.geometry, this.assets), this.assets.pose(this.hand, object, index)
    ]);
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
      node.matrixAutoUpdate = false;
      node.matrix.fromArray(grasp.matrices[i]).transpose();
      node.matrixWorldNeedsUpdate = true;
    });
    this.frame();
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
  render() {
    if (!this.renderer || !this.width || !this.height) return;
    const output = this.renderer.domElement;
    if (output.width !== this.canvas.width || output.height !== this.canvas.height) this.renderer.setSize(this.width, this.height, false);
    this.renderer.render(this.scene, this.camera);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(output, 0, 0, this.canvas.width, this.canvas.height);
  }
}

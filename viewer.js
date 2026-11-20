import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const finish = (color, metalness = .32, roughness = .43) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const paint = finish(0xffa02d, .43, .33);
const orange = finish(0xd86a1d, .38);
const navy = finish(0x213b54, .5, .33);
const steel = finish(0x5b6673, .76, .37);
const silver = finish(0xb5cad8, .82, .23);
const charcoal = finish(0x19212b, .35, .52);
const rubber = finish(0x15191f, .04, .84);
const tread = finish(0x242b32, .12, .76);
const glass = finish(0x50768d, .6, .18);
const white = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xb8d6fa, emissiveIntensity: .32 });
const red = finish(0xb3412f);
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 24);

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  parent.add(item);
  return item;
}

function box(parent, material, x, y, z, w, h, d, angle = 0) {
  const item = mesh(parent, boxGeometry, material, x, y, z);
  item.scale.set(w, h, d);
  item.rotation.z = angle;
  return item;
}

function cylinder(parent, material, x, y, z, radius, height, axial = false) {
  const item = mesh(parent, cylinderGeometry, material, x, y, z);
  item.scale.set(radius, height, radius);
  if (axial) item.rotation.x = Math.PI / 2;
  return item;
}

function prism(parent, material, points, depth, z = 0, bevel = .045) {
  const outline = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth, bevelEnabled: Boolean(bevel), bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1,
  });
  geometry.translate(0, 0, z - depth / 2);
  return mesh(parent, geometry, material);
}

function rod(parent, material, start, end, radius) {
  const center = start.clone().lerp(end, .5);
  const item = cylinder(parent, material, center.x, center.y, center.z, radius, start.distanceTo(end));
  item.quaternion.setFromUnitVectors(V(0, 1, 0), end.clone().sub(start).normalize());
  return item;
}

function hydraulic(parent, start, end, radius = .12) {
  rod(parent, charcoal, start, start.clone().lerp(end, .64), radius);
  rod(parent, silver, start.clone().lerp(end, .56), end, radius * .59);
}

function label(parent, text, x, y, z, width) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.font = 'italic 800 84px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#edf2f7';
  context.fillText(text, 256, 68, 500);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const plane = new THREE.PlaneGeometry(width, width / 4);
  mesh(parent, plane, material, x, y, z);
  mesh(parent, plane, material, x, y, -z).rotation.y = Math.PI;
}

function cab(parent, x, y, z, width, height, depth) {
  const cab = new THREE.Group();
  parent.add(cab);
  cab.position.set(x, y, z);
  box(cab, charcoal, 0, .07, 0, width, .14, depth);
  const profile = [[-width/2,.18], [width/2,.18], [width*.36,height], [-width*.45,height]];
  prism(cab, charcoal, profile, depth, 0, .025);
  const windows = [[-width*.36,.31], [width*.39,.31], [width*.27,height-.14], [-width*.34,height-.14]];
  for (const side of [-1, 1]) {
    prism(cab, glass, windows, .03, side*(depth/2+.038), .012);
    box(cab, charcoal, -.06, height*.57, side*(depth/2+.068), .065, height*.65, .043);
    box(cab, silver, width*.07, .43, side*(depth/2+.083), .11, .03, .037);
    rod(cab, charcoal, V(width*.34, height*.77, side*depth*.47), V(width*.41, height*.77, side*depth*.68), .034);
    box(cab, charcoal, width*.42, height*.8, side*depth*.70, .10, .23, .07);
  }
  const windshield = box(cab, glass, width*.44+.037, height*.60, 0, .052, height*.56, depth*.84);
  windshield.rotation.z = .11;
  box(cab, navy, -width*.035, height+.04, 0, width*.98, .13, depth*1.08);
  box(cab, white, width*.41, height+.02, -depth*.29, .11, .068, .16);
  box(cab, white, width*.41, height+.02, depth*.29, .11, .068, .16);
}

function bucket(parent, x, y, z, width, scale = 1) {
  const implement = new THREE.Group();
  implement.position.set(x, y, z);
  implement.scale.setScalar(scale);
  parent.add(implement);
  const shape = [[-.52,.04],[-.45,-.37],[-.17,-.57],[.48,-.55],[.74,-.34],[.23,-.28],[.03,-.08],[-.02,.24]];
  prism(implement, steel, shape, width, 0, .035);
  for (const side of [-1, 1]) {
    prism(implement, charcoal, [[-.49,.04],[-.38,-.37],[-.13,-.51],[.43,-.50],[.69,-.33],[.13,-.19],[-.01,.18]], .08, side*width/2, .025);
  }
  for (let index = 0; index < 6; index++) {
    box(implement, silver, .65, -.48, (index-2.5)*width/6, .34, .13, width*.10, .23);
  }
  cylinder(implement, silver, -.22, .14, 0, .11, width*.66, true);
}

function track(parent, z) {
  prism(parent, rubber, [[-1.83,.24],[-2.11,.50],[-2.05,.93],[-1.74,1.13],[1.66,1.13],[1.98,.87],[2.02,.5],[1.74,.24]], .72, z, .09);
  for (const side of [-1,1]) {
    const outside = z + side*.39;
    box(parent, steel, -.03, .76, outside, 2.9, .22, .06);
    for (let i = -3; i <= 3; i++) {
      cylinder(parent, charcoal, i*.47, .56, outside, .29, .085, true);
      cylinder(parent, steel, i*.47, .56, outside+side*.055, .16, .05, true);
    }
    for (const x of [-1.72, 1.64]) {
      cylinder(parent, steel, x, .70, outside, .35, .09, true);
      cylinder(parent, navy, x, .70, outside+side*.09, .19, .09, true);
      cylinder(parent, silver, x, .70, outside+side*.14, .07, .04, true);
    }
  }
  for (let i = -9; i <= 9; i++) {
    box(parent, steel, i*.19-.026, 1.18, z, .135, .08, .88);
    box(parent, tread, i*.19-.026, .17, z, .14, .11, .87);
  }
  for (const sign of [-1, 1]) {
    for (let step = 0; step < 6; step++) {
      const angle = -Math.PI/2 + Math.PI * step / 5;
      box(parent, steel, sign*(1.73 + Math.cos(angle)*.41)-.025, .68 + Math.sin(angle)*.49, z, .075, .125, .86, angle*sign);
    }
  }
}

function excavator() {
  const group = new THREE.Group();
  track(group, .98);
  track(group, -.98);
  box(group, navy, -.12, .85, 0, 3.3, .41, 1.52);
  cylinder(group, steel, -.31, 1.28, 0, .67, .21);
  box(group, charcoal, -.56, 1.45, 0, 3.0, .23, 2.34);
  prism(group, paint, [[-2.15,1.46],[-2.16,2.01],[-1.87,2.23],[-.57,2.24],[-.18,1.94],[-.19,1.49]], 2.14, 0, .085);
  box(group, navy, -1.37, 2.21, 0, 1.31, .08, 1.50);
  for (let i = 0; i < 7; i++) {
    box(group, charcoal, -1.82+i*.109, 1.96, 1.175, .061, .18, .038);
    box(group, charcoal, -1.82+i*.109, 1.96, -1.175, .061, .18, .038);
  }
  cab(group, .14, 1.48, .72, 1.05, 1.28, .84);
  cylinder(group, charcoal, -.97, 2.37, -.72, .095, .46);
  cylinder(group, steel, -.97, 2.59, -.72, .124, .07);
  prism(group, orange, [[.21,1.65],[.36,2.08],[1.53,3.48],[2.66,3.89],[2.86,3.70],[1.80,3.06]], .42, -.32, .068);
  prism(group, paint, [[2.57,3.75],[2.80,3.79],[3.26,3.35],[3.61,1.16],[3.39,1.03],[3.03,2.77]], .30, -.32, .055);
  for (const z of [-.64, -.02]) hydraulic(group, V(.10,1.67,z), V(1.72,3.26,z), .11);
  hydraulic(group, V(1.57,3.49,-.31), V(3.08,3.36,-.31), .104);
  hydraulic(group, V(3.28,2.64,-.32), V(3.72,1.20,-.32), .084);
  for (const [x,y,r] of [[.37,1.94,.19],[2.71,3.68,.17],[3.49,1.17,.12]]) {
    cylinder(group, steel, x, y, -.32, r, .66, true);
    cylinder(group, silver, x, y, .045, r*.51, .08, true);
  }
  bucket(group, 3.70, .94, -.32, .97, 1.1);
  label(group, 'HTE 420', -1.45, 1.68, 1.168, 1.2);
  return group;
}

function wheel(parent, x, z, radius, width) {
  cylinder(parent, rubber, x, radius, z, radius, width, true);
  for (const side of [-1, 1]) {
    cylinder(parent, tread, x, radius, z + side*width*.475, radius*.92, width*.09, true);
    cylinder(parent, orange, x, radius, z + side*width*.53, radius*.56, width*.107, true);
    cylinder(parent, navy, x, radius, z + side*width*.6, radius*.32, width*.105, true);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      cylinder(parent, silver, x + Math.cos(angle)*radius*.41, radius + Math.sin(angle)*radius*.41, z+side*width*.594, radius*.052, .045, true);
    }
  }
  for (let i = 0; i < 20; i++) {
    const angle = i * Math.PI / 10;
    for (const band of [-1, 1]) {
      const staggered = angle + band*.047;
      box(parent, tread, x + Math.cos(staggered)*radius*.994, radius + Math.sin(staggered)*radius*.994, z + band*width*.235, radius*.093, radius*.22, width*.46, staggered);
    }
  }
}

function loader() {
  const group = new THREE.Group();
  for (const z of [-1.13, 1.13]) {
    wheel(group, -1.47, z, .78, .62);
    wheel(group, 1.27, z, .78, .62);
  }
  box(group, charcoal, -.25, .83, 0, 4.06, .45, 1.65);
  prism(group, paint, [[-2.44,1.03],[-2.36,1.78],[-1.68,1.97],[-.62,1.96],[-.31,1.27],[-.35,1.03]], 1.72, 0, .08);
  box(group, charcoal, -2.43, 1.40, 0, .15, .49, 1.47);
  for (const z of [-.89, .89]) {
    for (let i = 0; i < 8; i++) box(group, charcoal, -2.20+i*.115, 1.63, z+.027*Math.sign(z), .052, .23, .044);
    box(group, navy, -1.44, 1.45, z, 1.54, .13, .72);
    box(group, navy, 1.22, 1.49, z, 1.48, .13, .72);
    box(group, red, -2.46, 1.66, z*.79, .095, .12, .17);
    prism(group, paint, [[.30,1.31],[.31,2.18],[.63,2.27],[1.18,1.37],[2.75,.98],[2.97,.65],[2.61,.48],[.95,1.05]], .24, z*.61, .055);
    hydraulic(group, V(.61,1.05,z*.89), V(1.23,1.67,z*.89), .105);
    cylinder(group, silver, .5, 2.04, z*.78, .115, .17, true);
    cylinder(group, silver, 2.72, .80, z*.77, .11, .18, true);
  }
  cab(group, -.54, 1.57, 0, 1.25, 1.48, 1.48);
  cylinder(group, charcoal, -1.45, 2.18, -.55, .092, .64);
  box(group, navy, .55, 1.40, 0, 1.3, .56, 1.38);
  bucket(group, 3.07, .63, 0, 2.61, 1.02);
  label(group, 'HTL 680', -1.39, 1.86, .922, 1.05);
  return group;
}

function truck() {
  const group = new THREE.Group();
  for (const z of [-1.23, 1.23]) {
    wheel(group, 1.73, z, .88, .69);
    wheel(group, -1.29, z, .97, .77);
    box(group, steel, 1.7, 1.82, z, 1.50, .18, .65);
    box(group, orange, -1.33, 1.89, z, 1.85, .16, .74);
  }
  box(group, charcoal, .10, .93, 0, 5.15, .61, 1.97);
  box(group, paint, 1.67, 1.54, 0, 2.03, .71, 2.08);
  box(group, navy, 2.33, 1.96, -.47, .58, .73, 1.16);
  box(group, charcoal, 2.76, 1.51, 0, .34, .21, 2.73);
  box(group, charcoal, 2.72, 1.83, -.17, .10, .51, 1.22);
  for (let i = 0; i < 8; i++) box(group, steel, 2.79, 1.66+i*.049, -.17, .046, .018, 1.11);
  for (const z of [-1.06, 1.06]) box(group, white, 2.77, 1.76, z, .09, .15, .23);
  cab(group, 1.68, 1.79, .66, 1.12, 1.18, .86);
  const bed = [[-2.79,2.62],[-2.32,1.86],[.52,1.86],[1.47,2.40],[1.64,3.36],[.91,3.40],[.31,2.72],[-2.60,2.72]];
  box(group, steel, -.83, 1.99, 0, 2.98, .22, 2.54);
  for (const side of [-1, 1]) {
    prism(group, paint, bed, .13, side*1.34, .06);
    box(group, orange, -1.10, 2.66, side*1.46, 3.19, .11, .09);
    for (let i = 0; i < 6; i++) box(group, orange, -2.40+i*.49, 2.30, side*1.46, .13, .66, .09, -.22);
    hydraulic(group, V(.55,1.02,side*.74), V(-.56,1.91,side*.74), .14);
    rod(group, silver, V(1.27,1.79,side*1.53), V(1.49,2.35,side*1.53), .038);
  }
  box(group, orange, 1.02, 2.74, 0, .15, 1.26, 2.70, -.55);
  box(group, paint, 1.30, 3.38, 0, 1.4, .12, 2.75);
  for (let i=0; i<5; i++) box(group, steel, 1.49, 1.20+i*.115, 1.48, .32, .049, .18);
  label(group, 'HTM 105', -.24, 2.56, 1.52, 1.02);
  return group;
}

const kits = { excavator, loader, truck };

function stage(scene) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size/2, size/2, size*.03, size/2, size/2, size*.49);
  gradient.addColorStop(0, '#20314970');
  gradient.addColorStop(.62, '#2031492b');
  gradient.addColorStop(1, '#0000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,size,size);
  const shadow = mesh(scene, new THREE.PlaneGeometry(9,5.7), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false,
  }), 0, .015);
  shadow.rotation.x = -Math.PI/2;
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x577891, transparent: true, opacity: .52, side: THREE.DoubleSide });
  for (const [radius, thickness] of [[3.57,.018],[3.93,.009]]) {
    mesh(scene, new THREE.RingGeometry(radius, radius+thickness, 96), ringMaterial).rotation.x = -Math.PI/2;
  }
}

export function createShowroom(surface, onLost) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.23;
  renderer.setClearColor(0x000000, 0);
  surface.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.maxPolarAngle = Math.PI * .484;
  controls.autoRotateSpeed = .72;
  // Let ordinary wheel scrolling travel down the page before the viewer is engaged.
  renderer.domElement.addEventListener('wheel', event => cycleWheel(event), { capture: true, passive: true });
  function cycleWheel(event) {
    if (document.activeElement !== surface && !event.ctrlKey) event.stopImmediatePropagation();
  }
  renderer.domElement.addEventListener('pointerdown', () => surface.focus({ preventScroll: true }));

  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, .04).texture;
  scene.environmentIntensity = .82;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe1eeff, 0x786451, 2.1));
  const key = new THREE.DirectionalLight(0xffe3c6, 2.55);
  key.position.set(6, 10, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x92c3ff, 2.6);
  rim.position.set(-4, 5, -6);
  scene.add(rim);
  stage(scene);

  let current;
  let distance = 12;
  let targetHeight = 1.6;
  let inView = false;
  const groups = new Map();
  const render = () => renderer.render(scene, camera);
  const loop = () => {
    controls.update();
  };
  controls.addEventListener('change', render);

  function reset() {
    const direction = V(.60, .37, 1).normalize();
    controls.target.set(0, targetHeight, 0);
    camera.position.copy(controls.target).addScaledVector(direction, distance);
    controls.update();
    render();
  }

  function fit() {
    const w = surface.clientWidth || 1;
    const h = surface.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(halfFov) * camera.aspect);
    distance = Math.max(10.7, 3.9 / Math.tan(horizontal), targetHeight * 1.42 / Math.tan(halfFov));
    controls.minDistance = distance*.57;
    controls.maxDistance = distance*1.75;
    reset();
  }

  const resize = new ResizeObserver(fit);
  resize.observe(surface);
  const watch = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    renderer.setAnimationLoop(inView ? loop : null);
    if (inView) render();
  });
  watch.observe(surface);
  renderer.domElement.addEventListener('webglcontextlost', () => {
    renderer.setAnimationLoop(null);
    resize.disconnect();
    watch.disconnect();
    controls.dispose();
    renderer.domElement.remove();
    onLost();
  }, { once: true });

  function select(id) {
    if (!groups.has(id)) {
      const group = kits[id]();
      const bounds = new THREE.Box3().setFromObject(group);
      const center = bounds.getCenter(V(0,0,0));
      group.position.set(-center.x, -bounds.min.y+.04, -center.z);
      groups.set(id, { group, height: (bounds.max.y-bounds.min.y)*.48 });
    }
    if (current) scene.remove(current);
    const selection = groups.get(id);
    current = selection.group;
    targetHeight = selection.height;
    scene.add(current);
    fit();
  }

  surface.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
    event.preventDefault();
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (event.key === 'ArrowLeft') spherical.theta -= .17;
    if (event.key === 'ArrowRight') spherical.theta += .17;
    if (event.key === 'ArrowUp') spherical.phi = Math.max(.18, spherical.phi-.12);
    if (event.key === 'ArrowDown') spherical.phi = Math.min(controls.maxPolarAngle, spherical.phi+.12);
    if (['+', '='].includes(event.key)) spherical.radius *= .89;
    if (event.key === '-') spherical.radius *= 1.12;
    camera.position.copy(controls.target).add(V(0,0,0).setFromSpherical(spherical));
    controls.update();
    render();
  });

  return {
    select,
    reset,
    setAutoRotate(value) {
      controls.autoRotate = value;
      if (inView) render();
    },
  };
}

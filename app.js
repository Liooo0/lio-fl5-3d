import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const FL5 = window.__fl5;
const errPush = m => { FL5.errs.push(String(m).slice(0, 300)); if (FL5.errs.length > 50) FL5.errs.length = 50; };

try { main(); } catch (e) { errPush('init fatal: ' + ((e && e.stack) || e)); FL5.phase = 'error'; }

function main() {
  FL5.phase = 'build';

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lerp = THREE.MathUtils.lerp;
  const ease = u => u * u * (3 - 2 * u);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.84;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b12);
  scene.fog = new THREE.Fog(0x070b12, 20, 60);


  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 100);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5), 0.38, 0.3, 0.87);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  camera.position.set(4.7, 2.85, 5.55);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.62, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.12;
  controls.maxDistance = 16;
  controls.maxPolarAngle = Math.PI * 0.55;

  try { controls.zoomToCursor = true; } catch (_) {}

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  Object.assign(labelRenderer.domElement.style, { position: 'fixed', top: '0', left: '0', pointerEvents: 'none', zIndex: '9' });
  document.body.appendChild(labelRenderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const hemi = new THREE.HemisphereLight(0x2a3b55, 0x0a0c10, 0.32);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xcfe0ff, 1.9);
  key.position.set(4.5, 7.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -3.6; key.shadow.camera.right = 3.6;
  key.shadow.camera.top = 3.6; key.shadow.camera.bottom = -3.6;
  key.shadow.camera.near = 1; key.shadow.camera.far = 22;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd9a8, 0.28);
  fill.position.set(-5, 3.5, -5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x6f9fff, 1.15);
  rim.position.set(-2.5, 4.5, -6.5);
  scene.add(rim);

  const groundTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g2 = c.getContext('2d');
    const rg = g2.createRadialGradient(256, 256, 50, 256, 256, 256);
    rg.addColorStop(0, '#141924'); rg.addColorStop(0.55, '#10141d'); rg.addColorStop(1, '#05070c');
    g2.fillStyle = rg; g2.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(17, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.52, metalness: 0.35, envMapIntensity: 0.26 }));
  ground.receiveShadow = true;
  ground.userData.noPick = true;
  scene.add(ground);
  const aoTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g2 = c.getContext('2d');
    const rg = g2.createRadialGradient(128, 128, 10, 128, 128, 126);
    rg.addColorStop(0, 'rgba(0,0,0,0.68)'); rg.addColorStop(0.55, 'rgba(0,0,0,0.34)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g2.fillStyle = rg; g2.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const aoBlob = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.9).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false }));
  aoBlob.position.y = 0.005;
  aoBlob.renderOrder = 1;
  scene.add(aoBlob);
  (() => {
    const sc = document.createElement('canvas'); sc.width = 4; sc.height = 256;
    const sg2 = sc.getContext('2d');
    const grad = sg2.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#04060b'); grad.addColorStop(0.55, '#0a101c'); grad.addColorStop(1, '#131c2c');
    sg2.fillStyle = grad; sg2.fillRect(0, 0, 4, 256);
    const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16),
      new THREE.MeshBasicMaterial({ map: st, side: THREE.BackSide, depthWrite: false, fog: false }));
    scene.add(dome);
  })();

  function honeyTex(repX, repY) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0a0b0d'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#3a3e44'; g.lineWidth = 3.2;
    const r = 15, h = r * Math.sqrt(3);
    const hex = (x, y) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); };
    for (let row = -1; row < 256 / h + 1; row++) for (let col = -1; col < 256 / (r * 1.5) + 1; col++)
      hex(col * r * 3, row * h + (Math.abs(col) % 2 ? h / 2 : 0));
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX || 3, repY || 1);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function finTex(repX, repY) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#141618'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#2c3034';
    for (let y = 0; y < 128; y += 6) g.fillRect(0, y, 128, 2.4);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX || 4, repY || 2);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const MAT = {
    paint: new THREE.MeshPhysicalMaterial({ color: 0x7a0d12, roughness: 0.46, metalness: 0.22, clearcoat: 1.0, clearcoatRoughness: 0.09, transparent: true, envMapIntensity: 0.38 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x10222e, roughness: 0.06, metalness: 0.5, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ color: 0x131417, roughness: 0.7, transparent: true }),
    honey: new THREE.MeshStandardMaterial({ color: 0xffffff, map: honeyTex(3, 1), roughness: 0.6, metalness: 0.3, transparent: true, opacity: 0.92 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xcfe4f2, emissive: 0x9fc4dd, emissiveIntensity: 0.4, roughness: 0.2, transparent: true }),
    lampR: new THREE.MeshStandardMaterial({ color: 0xa01420, emissive: 0xc41d2c, emissiveIntensity: 0.7, roughness: 0.3, transparent: true }),
    badge: new THREE.MeshStandardMaterial({ color: 0xd0021b, emissive: 0x550000, emissiveIntensity: 0.3, roughness: 0.35 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.95 }),
    gloss: new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.25, metalness: 0.7 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.26, metalness: 0.88 }),
    rimDS: new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.26, metalness: 0.88, side: THREE.DoubleSide }),
    spoke: new THREE.MeshStandardMaterial({ color: 0xb0b6bd, roughness: 0.22, metalness: 0.95 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x232529, roughness: 0.85 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xbac0c6, roughness: 0.34, metalness: 0.85 }),
    aluDark: new THREE.MeshStandardMaterial({ color: 0x878d94, roughness: 0.5, metalness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.28, metalness: 0.95 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x585c62, roughness: 0.62, metalness: 0.8 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.34, metalness: 0.92 }),
    vcover: new THREE.MeshStandardMaterial({ color: 0xc0121f, roughness: 0.42, metalness: 0.35 }),
    hose: new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.9 }),
    blueSil: new THREE.MeshStandardMaterial({ color: 0x1f4fd0, roughness: 0.5 }),
    blueAnod: new THREE.MeshStandardMaterial({ color: 0x16294e, roughness: 0.3, metalness: 0.85 }),
    blueShield: new THREE.MeshStandardMaterial({ color: 0x1f66d0, roughness: 0.34, metalness: 0.78, side: THREE.DoubleSide }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe2e5e8, roughness: 0.1, metalness: 1.0 }),
    caliper: new THREE.MeshStandardMaterial({ color: 0xd2141a, roughness: 0.32 }),
    springM: new THREE.MeshStandardMaterial({ color: 0x9c1620, roughness: 0.45, metalness: 0.4 }),
    biw: new THREE.MeshStandardMaterial({ color: 0x3a414b, roughness: 0.55, metalness: 0.4, transparent: true, opacity: 0, depthWrite: false }),
    seat: new THREE.MeshStandardMaterial({ color: 0xa81c2a, roughness: 0.85 }),
    seatDark: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.9 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0a2038, emissive: 0x1c4e8a, emissiveIntensity: 0.6, roughness: 0.2 }),
    cluster: new THREE.MeshStandardMaterial({ color: 0x180a0a, emissive: 0xb3202a, emissiveIntensity: 0.4, roughness: 0.3 }),
    tank: new THREE.MeshStandardMaterial({ color: 0x3d4046, roughness: 0.7 }),
    coolant: new THREE.MeshStandardMaterial({ color: 0xe6eaec, roughness: 0.35, transparent: true, opacity: 0.88 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xd8b022, roughness: 0.5 }),
    fins: new THREE.MeshStandardMaterial({ color: 0xffffff, map: finTex(5, 2), roughness: 0.55, metalness: 0.4 })
  };

  const SHELL_MATS = new Set([MAT.paint, MAT.glass, MAT.trim, MAT.honey, MAT.lamp, MAT.lampR]);
  const SHELL_MESHES = [];
  const PARTS = [];
  const EXP = [];
  let glassGeo = null;
  const PINS = [];
  const GLB_SHELL_MATS = [];
  let shellMode = 'proc';
  let shellRootG = null;

  function reg(mesh, parent, label, opt) {
    opt = opt || {};
    mesh.castShadow = opt.cast !== false;
    mesh.receiveShadow = true;
    if (opt.shell) SHELL_MESHES.push(mesh);
    if (label) { mesh.userData.label = label; PARTS.push(mesh); }
    (parent || scene).add(mesh);
    return mesh;
  }
  function box(w, h, d, mat, parent, x, y, z, label, opt) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (opt && opt.rx) m.rotation.x = opt.rx;
    if (opt && opt.ry) m.rotation.y = opt.ry;
    if (opt && opt.rz) m.rotation.z = opt.rz;
    return reg(m, parent, label, opt);
  }
  function cyl(rt, rb, h, seg, mat, parent, x, y, z, label, opt) {
    opt = opt || {};
    const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!opt.open);
    if (opt.axis === 'X') g.rotateZ(Math.PI / 2);
    else if (opt.axis === 'Z') g.rotateX(Math.PI / 2);
    if (opt.thetaStart !== undefined) {
      const g2 = new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!opt.open, opt.thetaStart, opt.thetaLen);
      if (opt.axis === 'X') g2.rotateZ(Math.PI / 2);
      else if (opt.axis === 'Z') g2.rotateX(Math.PI / 2);
      g.dispose(); g.copy(g2); g2.dispose();
    }
    const m = new THREE.Mesh(g, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (opt.rx) m.rotation.x = opt.rx;
    if (opt.ry) m.rotation.y = opt.ry;
    if (opt.rz) m.rotation.z = opt.rz;
    return reg(m, parent, label, opt);
  }
  function torus(R, t, mat, parent, x, y, z, label, opt) {
    opt = opt || {};
    const g = new THREE.TorusGeometry(R, t, opt.rs || 10, opt.ts || 26, opt.arc || Math.PI * 2);
    if (opt.axis === 'X') g.rotateY(Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (opt.rx) m.rotation.x = opt.rx;
    if (opt.ry) m.rotation.y = opt.ry;
    if (opt.rz) m.rotation.z = opt.rz;
    return reg(m, parent, label, opt);
  }
  function tubeBetween(a, b, r1, r2, mat, parent, label, opt) {
    opt = opt || {};
    const d = b.clone().sub(a);
    const len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 !== undefined ? r2 : r1, r1, len, opt.seg || 12), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
    return reg(m, parent, label, opt);
  }
  function pipe(pts, r, mat, parent, label, opt) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const nSeg = Math.max(24, pts.length * 12);
    return reg(new THREE.Mesh(new THREE.TubeGeometry(curve, nSeg, r, 10, false), mat), parent, label, opt);
  }
  function spring(p1, p2, radius, coils, tubeR, mat, parent, label) {
    const axis = p2.clone().sub(p1);
    const len = axis.length();
    axis.normalize();
    const up = Math.abs(axis.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(axis, up).normalize();
    const w = new THREE.Vector3().crossVectors(axis, u);
    const N = Math.round(coils * 22);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = t * coils * Math.PI * 2;
      pts.push(p1.clone().addScaledVector(axis, len * t).addScaledVector(u, Math.cos(a) * radius).addScaledVector(w, Math.sin(a) * radius));
    }
    return reg(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, tubeR, 8, false), mat), parent, label);
  }
  function group(parent, exDir) {
    const g = new THREE.Group();
    g.userData.basePos = g.position.clone();
    if (parent) parent.add(g);
    if (exDir) EXP.push({ o: g, d: exDir });
    return g;
  }

  const AXLE_F = 1.35, AXLE_R = -1.42, TRACK = 0.78;

  function flankW(y, z) {
    const t = (v, a, b) => THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
    let ty;
    if (y < 0.32) ty = lerp(0.945, 1, t(y, 0.16, 0.32));
    else if (y < 0.86) ty = 1;
    else if (y < 1.20) ty = lerp(1, 0.80, t(y, 0.86, 1.20));
    else ty = lerp(0.80, 0.62, t(y, 1.20, 1.44));
    const az = Math.abs(z);
    const pl = az > 1.15 ? lerp(1, 0.885, t(az, 1.15, 2.38)) : 1;
    const bulge = 0.030 * Math.exp(-Math.pow((z - AXLE_F) / 0.17, 2)) + 0.030 * Math.exp(-Math.pow((z + 1.42) / 0.17, 2));
    const hiFade = 1 - t(y, 0.72, 1.05);
    return 0.86 * ty * pl + 0.86 * bulge * hiFade;
  }

  const bodyG = group(scene, V(0, 1.25, 0));
  const biwG = group(scene, V(0, 0.8, 0));
  biwG.userData.noPick = true;
  const interiorG = group(scene, V(0, 0.62, 0));
  interiorG.userData.rot = ['y', 0.05];
  const engineG = group(scene, V(0, 0.34, 0));
  engineG.userData.rot = ['z', -0.07];
  const turboG = group(scene, V(0.10, 0.28, 0.20));
  const chargeG = group(scene, V(0, 0.05, 0.70));
  const coolingG = group(scene, V(0, 0.12, 1.12));
  const exhaustG = group(scene, V(0, -0.58, 0));
  const driveG = group(scene, V(-0.55, 0.16, 0));
  const suspG = group(scene, V(0, -0.40, 0));
  const fuelG = group(scene, V(0, -0.76, 0));
  const battG = group(scene, V(-0.36, 0.48, 0));

  (function buildBody() {
    const sh = new THREE.Shape();
    sh.moveTo(2.14, 0.36);
    sh.lineTo(2.155, 0.56); sh.lineTo(2.12, 0.75); sh.lineTo(1.80, 0.865);
    sh.lineTo(0.62, 0.925); sh.lineTo(0.40, 1.00); sh.lineTo(0.05, 1.30);
    sh.lineTo(-0.50, 1.335); sh.lineTo(-0.95, 1.27); sh.lineTo(-1.55, 0.985);
    sh.lineTo(-1.95, 0.885); sh.lineTo(-2.19, 0.875); sh.lineTo(-2.215, 0.62);
    sh.lineTo(-2.225, 0.40);
    sh.lineTo(-1.88, 0.30);
    sh.absarc(-1.42, 0.30, 0.46, Math.PI, 0, true);
    sh.lineTo(0.89, 0.30);
    sh.absarc(1.35, 0.30, 0.46, Math.PI, 0, true);
    sh.lineTo(2.05, 0.30);
    sh.closePath();
    let bg = new THREE.ExtrudeGeometry(sh, { depth: 1.54, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.06, bevelSegments: 3, curveSegments: 24 });
    bg.translate(0, 0, -0.77);
    bg.rotateY(-Math.PI / 2);
    bg.deleteAttribute('uv'); bg.deleteAttribute('normal');
    bg = mergeVertices(bg, 1e-3);
    const bp = bg.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      bp.setX(i, bp.getX(i) * flankW(bp.getY(i), bp.getZ(i)) / 0.86);
    }
    bg.computeVertexNormals();
    reg(new THREE.Mesh(bg, MAT.paint), bodyG, '车壳(Fastback 掀背溜背轮廓)', { shell: true });

    const sg = (() => {
      const s = new THREE.Shape();
      s.moveTo(0.32, 0.97); s.lineTo(0.03, 1.255); s.lineTo(-0.58, 1.272); s.lineTo(-1.04, 1.125);
      s.lineTo(-1.30, 0.965); s.lineTo(-1.02, 0.845); s.lineTo(-0.20, 0.845); s.closePath();
      const gg = new THREE.ShapeGeometry(s, 14);
      gg.rotateY(-Math.PI / 2);
      const gp = gg.attributes.position;
      for (let i = 0; i < gp.count; i++) {
        gp.setX(i, flankW(gp.getY(i), gp.getZ(i)) * 1.006 + 0.003);
      }
      gg.computeVertexNormals();
      return gg;
    })();
    const gl = reg(new THREE.Mesh(sg, MAT.glass), bodyG, '侧窗玻璃(曲面深灰)', { shell: true, cast: false });
    gl.scale.x = -1;
    const gr = new THREE.Mesh(sg, MAT.glass);
    gr.castShadow = false;
    gr.userData.label = '侧窗玻璃(曲面深灰)';
    PARTS.push(gr);
    SHELL_MESHES.push(gr);
    bodyG.add(gr);
    glassGeo = sg;

    const wsG = new THREE.PlaneGeometry(1.10, 0.50);
    wsG.rotateX(-0.862);
    const ws = new THREE.Mesh(wsG, MAT.glass);
    ws.position.set(0, 1.15, 0.225);
    reg(ws, bodyG, '前风挡玻璃', { shell: true, cast: false });

    const rgG = new THREE.PlaneGeometry(1.10, 0.67);
    rgG.rotateX(-2.0);
    const rg = new THREE.Mesh(rgG, MAT.glass);
    rg.position.set(0, 1.128, -1.25);
    reg(rg, bodyG, '后风挡玻璃(快背溜背)', { shell: true, cast: false });

    box(1.16, 0.24, 0.05, MAT.honey, bodyG, 0, 0.47, 2.185, '蜂窝状前进气格栅', { shell: true, rx: -0.08 });
    box(0.075, 0.062, 0.018, MAT.badge, bodyG, 0, 0.505, 2.222, '红色 Type R 徽标', { shell: true });
    box(1.12, 0.15, 0.05, MAT.honey, bodyG, 0, 0.30, 2.11, '前保险杠下部进气口', { shell: true });
    box(0.20, 0.13, 0.05, MAT.honey, bodyG, 0.60, 0.38, 2.06, '前侧进气口', { shell: true });
    box(0.20, 0.13, 0.05, MAT.honey, bodyG, -0.60, 0.38, 2.06, null, { shell: true });
    box(0.30, 0.05, 0.06, MAT.trim, bodyG, 0.47, 0.645, 2.20, '全LED前大灯(熏黑灯罩)', { shell: true, ry: -0.34 });
    box(0.27, 0.018, 0.02, MAT.lamp, bodyG, 0.472, 0.652, 2.237, 'LED日行灯带', { shell: true, ry: -0.34, cast: false });
    box(0.30, 0.05, 0.06, MAT.trim, bodyG, -0.47, 0.645, 2.20, null, { shell: true, ry: 0.34 });
    box(0.27, 0.018, 0.02, MAT.lamp, bodyG, -0.472, 0.652, 2.237, null, { shell: true, ry: 0.34, cast: false });
    box(1.42, 0.026, 0.24, MAT.trim, bodyG, 0, 0.155, 2.12, '前唇扰流板', { shell: true });

    box(0.30, 0.05, 0.40, MAT.paint, bodyG, 0, 0.975, 0.78, '引擎盖进气口(Scoop)', { shell: true, rx: 0.10 });
    box(0.22, 0.016, 0.30, MAT.trim, bodyG, 0, 1.002, 0.77, null, { shell: true, rx: 0.10 });
    box(1.02, 0.022, 0.16, MAT.trim, bodyG, 0, 1.062, 0.40, null, { shell: true });

    box(0.40, 0.085, 0.06, MAT.lampR, bodyG, 0.52, 0.865, -2.27, 'LED组合式尾灯', { shell: true });
    box(0.40, 0.085, 0.06, MAT.lampR, bodyG, -0.52, 0.865, -2.27, null, { shell: true });
    box(0.44, 0.085, 0.04, MAT.trim, bodyG, 0, 0.865, -2.275, null, { shell: true });
    box(1.42, 0.16, 0.18, MAT.trim, bodyG, 0, 0.30, -2.22, '后扩散器区域', { shell: true });
    for (const fx of [-0.66, -0.42, 0.42, 0.66]) box(0.02, 0.15, 0.18, MAT.trim, bodyG, fx, 0.21, -2.24, null, { shell: true });

    const foilSh = new THREE.Shape();
    foilSh.moveTo(-0.155, 0);
    foilSh.quadraticCurveTo(-0.03, 0.034, 0.150, 0.010);
    foilSh.quadraticCurveTo(0.02, -0.020, -0.155, 0);
    const foilG = new THREE.ExtrudeGeometry(foilSh, { depth: 1.26, bevelEnabled: false });
    foilG.translate(0, 0, -0.63);
    foilG.rotateY(-Math.PI / 2);
    const foil = new THREE.Mesh(foilG, MAT.paint);
    foil.position.set(0, 1.24, -1.58);
    foil.rotation.x = -0.05;
    reg(foil, bodyG, '高位大尾翼(Type R 标志)', { shell: true });
    box(0.03, 0.24, 0.44, MAT.paint, bodyG, 0.60, 1.14, -1.55, null, { shell: true });
    box(0.03, 0.24, 0.44, MAT.paint, bodyG, -0.60, 1.14, -1.55, null, { shell: true });
    box(0.016, 0.14, 0.32, MAT.trim, bodyG, 0.615, 1.24, -1.58, null, { shell: true });
    box(0.016, 0.14, 0.32, MAT.trim, bodyG, -0.615, 1.24, -1.58, null, { shell: true });

    tubeBetween(V(0.70, 0.96, 0.40), V(0.775, 0.978, 0.385), 0.012, undefined, MAT.paint, bodyG, null, { shell: true });
    box(0.085, 0.078, 0.16, MAT.paint, bodyG, 0.79, 0.982, 0.378, '外后视镜', { shell: true });
    tubeBetween(V(-0.70, 0.96, 0.40), V(-0.775, 0.978, 0.385), 0.012, undefined, MAT.paint, bodyG, null, { shell: true });
    box(0.085, 0.078, 0.16, MAT.paint, bodyG, -0.79, 0.982, 0.378, null, { shell: true });

    box(0.05, 0.10, 1.78, MAT.trim, bodyG, 0.792, 0.275, 0.05, '侧裙', { shell: true });
    box(0.05, 0.10, 1.78, MAT.trim, bodyG, -0.792, 0.275, 0.05, null, { shell: true });
    box(0.045, 0.04, 0.13, MAT.paint, bodyG, 0, 1.39, -0.72, '鲨鱼鳍天线', { shell: true });

    box(1.46, 0.024, 3.35, MAT.trim, bodyG, 0, 0.285, -0.02, '地板(白车身)', { shell: true, cast: false });
    box(1.46, 0.52, 0.028, MAT.trim, bodyG, 0, 0.55, 0.73, '防火墙', { shell: true, cast: false });
    box(1.28, 0.022, 0.34, MAT.trim, bodyG, 0, 0.945, -1.88, null, { shell: true, cast: false });
  })();

  (function buildBiw() {
    const T = (a, b, r) => tubeBetween(a, b, r || 0.010, undefined, MAT.biw, biwG, null, { cast: false });
    for (const s of [1, -1]) {
      T(V(s * 0.60, 0.98, 0.40), V(s * 0.585, 1.30, 0.08));
      T(V(s * 0.60, 0.50, -0.34), V(s * 0.60, 1.27, -0.40));
      T(V(s * 0.60, 1.26, -0.62), V(s * 0.60, 0.95, -1.42));
      T(V(s * 0.585, 1.34, 0.10), V(s * 0.585, 1.31, -0.62));
      T(V(s * 0.66, 0.29, 1.85), V(s * 0.66, 0.29, -1.85));
      T(V(s * 0.30, 0.35, 0.74), V(s * 0.60, 0.98, 0.40));
    }
    T(V(-0.585, 1.31, 0.08), V(0.585, 1.31, 0.08));
    T(V(-0.72, 0.55, 1.95), V(0.72, 0.55, 1.95));
    T(V(-0.72, 0.35, 0.74), V(0.72, 0.35, 0.74));
    T(V(-0.72, 0.30, 0.02), V(0.72, 0.30, 0.02));
    T(V(-0.72, 0.35, -1.92), V(0.72, 0.35, -1.92));
    T(V(0, 0.30, 0.95), V(0, 0.30, -1.30), 0.032);
    T(V(-0.66, 0.92, -2.0), V(0.66, 0.92, -2.0));
    T(V(-0.60, 0.96, -1.44), V(0.60, 0.96, -1.44));
  })();

  (function buildInterior() {
    box(1.42, 0.03, 1.55, MAT.seatDark, interiorG, 0, 0.315, -0.25, null, { cast: false });
    box(1.44, 0.15, 0.32, MAT.plastic, interiorG, 0, 0.80, 0.60, '仪表台');
    box(1.44, 0.03, 0.36, MAT.plastic, interiorG, 0, 0.885, 0.58, null, { cast: false });
    box(0.17, 0.10, 0.025, MAT.screen, interiorG, 0, 0.82, 0.47, '中控屏幕');
    box(0.24, 0.09, 0.03, MAT.cluster, interiorG, -0.36, 0.845, 0.47, '液晶仪表');

    const sw = torus(0.105, 0.017, MAT.seatDark, interiorG, -0.36, 0.735, 0.50, '平底方向盘(红色回正标)', { rs: 10, ts: 24, arc: Math.PI * 1.62, rx: -0.35 });
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.02, 0.012), MAT.vcover);
    mark.position.set(-0.36, 0.837, 0.464);
    mark.rotation.x = -0.35;
    reg(mark, interiorG, null, { cast: false });
    const chord = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, 0.075), MAT.seatDark);
    chord.position.set(-0.36, 0.638, 0.528);
    chord.rotation.x = -0.35;
    reg(chord, interiorG, null, { cast: false });
    const spokeL = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.09, 0.016), MAT.seatDark);
    spokeL.position.set(-0.42, 0.72, 0.512);
    spokeL.rotation.x = -0.35;
    spokeL.rotation.z = 0.35;
    reg(spokeL, interiorG, null, { cast: false });
    const spokeR = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.09, 0.016), MAT.seatDark);
    spokeR.position.set(-0.30, 0.72, 0.512);
    spokeR.rotation.x = -0.35;
    spokeR.rotation.z = -0.35;
    reg(spokeR, interiorG, null, { cast: false });
    tubeBetween(V(-0.36, 0.72, 0.53), V(-0.36, 0.82, 0.62), 0.018, undefined, MAT.plastic, interiorG, null, { cast: false });

    box(0.14, 0.14, 0.90, MAT.plastic, interiorG, 0, 0.40, -0.05, '中央通道');
    cyl(0.05, 0.032, 0.05, 10, MAT.seatDark, interiorG, 0, 0.455, 0.12, null, {});
    tubeBetween(V(0, 0.46, 0.12), V(0, 0.60, 0.10), 0.011, undefined, MAT.gloss, interiorG, null, { cast: false });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 12), MAT.gloss);
    knob.position.set(0, 0.615, 0.10);
    reg(knob, interiorG, '6MT 手动换挡杆');

    function seat(x, zFront) {
      box(0.30, 0.10, 0.30, MAT.seatDark, interiorG, x, 0.47, zFront, 'Recaro 风格运动桶椅');
      box(0.20, 0.024, 0.26, MAT.seat, interiorG, x, 0.527, zFront, null, { cast: false });
      box(0.055, 0.095, 0.30, MAT.seatDark, interiorG, x + 0.155, 0.505, zFront, null, { cast: false });
      box(0.055, 0.095, 0.30, MAT.seatDark, interiorG, x - 0.155, 0.505, zFront, null, { cast: false });
      box(0.28, 0.44, 0.09, MAT.seatDark, interiorG, x, 0.695, zFront + 0.17, null, { rx: -0.16 });
      box(0.19, 0.34, 0.03, MAT.seat, interiorG, x, 0.70, zFront + 0.125, null, { rx: -0.16, cast: false });
      box(0.15, 0.10, 0.05, MAT.seatDark, interiorG, x, 0.955, zFront + 0.14, null, { rx: -0.16 });
    }
    seat(0.36, 0.16);
    seat(-0.36, 0.16);
    box(0.86, 0.10, 0.34, MAT.seat, interiorG, 0, 0.47, -0.52, '后排座椅');
    box(0.86, 0.42, 0.09, MAT.seat, interiorG, 0, 0.70, -0.70, null, { rx: -0.12 });
    box(0.15, 0.10, 0.05, MAT.seatDark, interiorG, 0.22, 0.945, -0.735, null, { rx: -0.12 });
    box(0.15, 0.10, 0.05, MAT.seatDark, interiorG, -0.22, 0.945, -0.735, null, { rx: -0.12 });
  })();

  (function buildEngine() {
    box(0.36, 0.30, 0.30, MAT.alu, engineG, -0.02, 0.43, 1.00, 'K20C1 2.0T 直列四缸缸体');
    box(0.365, 0.10, 0.30, MAT.aluDark, engineG, -0.02, 0.585, 1.00, '气缸盖(DOHC i-VTEC)');
    box(0.34, 0.075, 0.28, MAT.vcover, engineG, -0.02, 0.66, 1.00, '红色气门室盖(Type R 标志)');
    for (let i = 0; i < 4; i++) box(0.36, 0.012, 0.03, MAT.vcover, engineG, -0.02, 0.703, 0.92 + i * 0.053, null, { cast: false });
    for (let i = 0; i < 4; i++) cyl(0.017, 0.017, 0.012, 10, MAT.aluDark, engineG, -0.02, 0.706, 0.90 + i * 0.068, i === 0 ? '点火线圈位' : null, { cast: false });
    cyl(0.035, 0.035, 0.03, 12, MAT.alu, engineG, -0.12, 0.712, 0.94, '机油加注口盖', {});
    box(0.30, 0.10, 0.09, MAT.alu, engineG, -0.02, 0.57, 0.79, '进气歧管稳压腔');
    const plL = new THREE.Mesh(new THREE.SphereGeometry(0.049, 14, 12), MAT.alu);
    plL.position.set(-0.17, 0.57, 0.79);
    reg(plL, engineG, null, { cast: false });
    const plR = new THREE.Mesh(new THREE.SphereGeometry(0.049, 14, 12), MAT.alu);
    plR.position.set(0.13, 0.57, 0.79);
    reg(plR, engineG, null, { cast: false });
    for (let i = 0; i < 4; i++) {
      const xi = -0.13 + i * 0.085;
      pipe([V(xi, 0.55, 0.80), V(xi, 0.565, 0.845), V(xi, 0.58, 0.86)], 0.015, MAT.aluDark, engineG, i === 0 ? '进气歧管歧管' : null, { cast: false });
    }
    cyl(0.033, 0.033, 0.05, 14, MAT.chrome, engineG, -0.195, 0.57, 0.79, '电子节气门', { axis: 'X' });
    box(0.30, 0.095, 0.26, MAT.iron, engineG, -0.02, 0.282, 1.00, '油底壳');
    cyl(0.065, 0.065, 0.04, 18, MAT.aluDark, engineG, -0.02, 0.36, 1.165, '曲轴皮带轮', { axis: 'Z' });
    cyl(0.006, 0.006, 0.12, 6, MAT.yellow, engineG, 0.12, 0.52, 1.12, '机油尺', { rz: 0.35 });
    cyl(0.045, 0.045, 0.075, 14, MAT.aluDark, engineG, -0.30, 0.48, 1.17, '发电机', { axis: 'Z' });
    cyl(0.024, 0.024, 0.03, 10, MAT.chrome, engineG, -0.30, 0.48, 1.225, null, { axis: 'Z', cast: false });
    box(0.07, 0.09, 0.09, MAT.iron, engineG, 0.26, 0.40, 1.00, '发动机悬置');
    box(0.07, 0.09, 0.09, MAT.iron, engineG, -0.30, 0.40, 1.00, null);
    tubeBetween(V(-0.56, 0.755, 1.30), V(0.56, 0.755, 1.30), 0.018, undefined, MAT.steel, engineG, '前塔顶加强杆(顶吧)');
    box(0.06, 0.03, 0.06, MAT.aluDark, engineG, 0.56, 0.745, 1.30, null, { cast: false });
    box(0.06, 0.03, 0.06, MAT.aluDark, engineG, -0.56, 0.745, 1.30, null, { cast: false });
    cyl(0.105, 0.105, 0.05, 16, MAT.aluDark, suspG, 0.56, 0.715, 1.30, '前减震塔座(白车身)');
    cyl(0.105, 0.105, 0.05, 16, MAT.aluDark, suspG, -0.56, 0.715, 1.30, null);
  })();

  (function buildTurbo() {
    for (let i = 0; i < 3; i++) {
      const xi = -0.09 + i * 0.10;
      pipe([V(xi, 0.42, 1.16), V(xi * 0.6 + 0.03, 0.44, 1.24), V(0.05, 0.47, 1.295)], 0.021, MAT.copper, turboG, i === 0 ? '排气歧管(集成式)' : null, { cast: false });
    }
    torus(0.075, 0.042, MAT.copper, turboG, 0.05, 0.44, 1.315, '涡轮增压器 · 排气侧蜗壳', { axis: 'X', rs: 12, ts: 26 });
    cyl(0.042, 0.042, 0.07, 14, MAT.iron, turboG, 0.05, 0.365, 1.315, null, {});
    cyl(0.052, 0.052, 0.085, 16, MAT.aluDark, turboG, 0.115, 0.44, 1.315, '涡轮中间体(轴承壳)', { axis: 'X' });
    torus(0.06, 0.036, MAT.alu, turboG, 0.185, 0.44, 1.315, '压气机壳(进气侧)', { axis: 'X', rs: 12, ts: 26 });
    cyl(0.03, 0.03, 0.05, 12, MAT.aluDark, turboG, 0.235, 0.44, 1.315, null, { axis: 'X' });
    cyl(0.022, 0.022, 0.04, 10, MAT.aluDark, turboG, 0.05, 0.512, 1.36, ' wastegate 执行器', {});
  })();

  (function buildCharge() {
    pipe([V(0.185, 0.49, 1.315), V(0.22, 0.47, 1.42), V(0.30, 0.43, 1.55), V(0.28, 0.41, 1.70)], 0.030, MAT.gloss, chargeG, '增压管路(高压侧)', { cast: false });
    tubeBetween(V(0.213, 0.473, 1.40), V(0.243, 0.462, 1.50), 0.034, 0.034, MAT.blueSil, chargeG, null, { cast: false });
    box(0.56, 0.20, 0.045, MAT.fins, chargeG, 0, 0.41, 1.74, '前置中冷器 FMIC');
    box(0.04, 0.20, 0.05, MAT.plastic, chargeG, 0.29, 0.41, 1.74, null, { cast: false });
    box(0.04, 0.20, 0.05, MAT.plastic, chargeG, -0.29, 0.41, 1.74, null, { cast: false });
    pipe([V(-0.28, 0.41, 1.72), V(-0.40, 0.48, 1.52), V(-0.38, 0.60, 1.25), V(-0.20, 0.615, 1.02), V(-0.19, 0.585, 0.83)], 0.030, MAT.gloss, chargeG, '增压管路(冷却后)', { cast: false });
    tubeBetween(V(-0.192, 0.60, 0.90), V(-0.19, 0.592, 0.84), 0.034, 0.034, MAT.blueSil, chargeG, null, { cast: false });
    box(0.17, 0.15, 0.23, MAT.plastic, chargeG, 0.47, 0.565, 1.33, '空气滤清器总成');
    pipe([V(0.44, 0.70, 2.02), V(0.47, 0.66, 1.78), V(0.47, 0.60, 1.50)], 0.035, MAT.rubber, chargeG, '进气导流管', { cast: false });
  })();

  (function buildCooling() {
    box(0.60, 0.42, 0.04, MAT.fins, coolingG, 0, 0.50, 1.67, '散热器');
    box(0.035, 0.42, 0.06, MAT.plastic, coolingG, 0.32, 0.50, 1.67, null, { cast: false });
    box(0.035, 0.42, 0.06, MAT.plastic, coolingG, -0.32, 0.50, 1.67, null, { cast: false });
    torus(0.165, 0.011, MAT.plastic, coolingG, -0.12, 0.50, 1.615, '电子散热风扇', { ts: 28 });
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.135, 0.007), MAT.spoke);
      bl.position.set(-0.12 + 0.085 * Math.cos(a), 0.50 + 0.085 * Math.sin(a), 1.615);
      bl.rotation.z = a - Math.PI / 2;
      bl.rotation.y = 0.5;
      reg(bl, coolingG, null, { cast: false });
    }
    cyl(0.04, 0.04, 0.07, 12, MAT.plastic, coolingG, -0.12, 0.50, 1.578, null, { axis: 'Z' });
    pipe([V(-0.25, 0.695, 1.64), V(-0.40, 0.63, 1.45), V(-0.30, 0.56, 1.20)], 0.021, MAT.rubber, coolingG, '散热器上水管', { cast: false });
    pipe([V(-0.06, 0.30, 1.64), V(-0.12, 0.27, 1.38), V(0.02, 0.28, 1.17)], 0.021, MAT.rubber, coolingG, '散热器下水管', { cast: false });
    cyl(0.045, 0.045, 0.15, 14, MAT.coolant, coolingG, -0.55, 0.60, 1.44, '膨胀水壶(副水箱)');
    cyl(0.03, 0.03, 0.025, 12, MAT.plastic, coolingG, -0.55, 0.69, 1.44, null, {});
  })();

  (function buildExhaust() {
    pipe([V(0.05, 0.35, 1.315), V(0.07, 0.27, 1.16), V(0.03, 0.212, 0.98), V(0, 0.205, 0.84)], 0.042, MAT.iron, exhaustG, '涡轮下落管 Downpipe');
    cyl(0.044, 0.044, 0.40, 14, MAT.iron, exhaustG, 0, 0.205, 0.60, null, { axis: 'Z' });
    cyl(0.063, 0.063, 0.42, 18, MAT.blueShield, exhaustG, 0, 0.205, 0.60, '蓝色隔热罩排气头段', { axis: 'Z', open: true, thetaStart: 0.4, thetaLen: Math.PI * 2 - 0.8 });
    cyl(0.06, 0.06, 0.30, 16, MAT.steel, exhaustG, 0, 0.202, 0.30, '高流量三元催化器');
    cyl(0.043, 0.043, 0.55, 12, MAT.steel, exhaustG, 0, 0.203, -0.12, null, { axis: 'Z' });
    cyl(0.058, 0.058, 0.26, 16, MAT.steel, exhaustG, 0, 0.205, -0.52, '中段谐振腔');
    cyl(0.043, 0.043, 0.62, 12, MAT.steel, exhaustG, 0, 0.208, -1.03, null, { axis: 'Z' });
    box(0.36, 0.17, 0.44, MAT.steel, exhaustG, 0, 0.235, -1.55, '后消音器');
    for (const tx of [-0.11, 0, 0.11]) {
      tubeBetween(V(tx, 0.24, -1.77), V(tx, 0.255, -2.22), 0.036, undefined, MAT.steel, exhaustG, null, { cast: false });
      cyl(0.042, 0.042, 0.16, 16, MAT.chrome, exhaustG, tx, 0.255, -2.30, tx === 0 ? '中置三出排气尾喉(中央)' : '三出尾喉', { axis: 'Z', open: true });
      cyl(0.031, 0.031, 0.145, 12, MAT.gloss, exhaustG, tx, 0.255, -2.292, null, { axis: 'Z' });
      torus(0.041, 0.006, MAT.chrome, exhaustG, tx, 0.255, -2.378, null, { cast: false });
    }
  })();

  (function buildDrivetrain() {
    cyl(0.15, 0.195, 0.17, 20, MAT.aluDark, driveG, -0.265, 0.44, 1.00, '离合器壳体', { axis: 'X' });
    cyl(0.115, 0.15, 0.30, 20, MAT.alu, driveG, -0.50, 0.425, 0.985, '6MT 手动变速箱(Honda 6速)', { axis: 'X' });
    cyl(0.07, 0.115, 0.12, 16, MAT.aluDark, driveG, -0.71, 0.41, 0.97, null, { axis: 'X' });
    cyl(0.115, 0.115, 0.16, 18, MAT.aluDark, driveG, -0.52, 0.38, 1.24, '前差速器', { axis: 'Z' });
    tubeBetween(V(-0.52, 0.37, 1.26), V(-0.615, 0.335, 1.34), 0.017, undefined, MAT.steel, driveG, '左半轴');
    cyl(0.048, 0.024, 0.09, 12, MAT.rubber, driveG, -0.575, 0.352, 1.30, 'CV防尘套', {});
    tubeBetween(V(-0.52, 0.37, 1.26), V(0.615, 0.335, 1.345), 0.017, undefined, MAT.steel, driveG, '右半轴(带中间轴承)', { seg: 10 });
    cyl(0.048, 0.024, 0.09, 12, MAT.rubber, driveG, -0.455, 0.358, 1.29, null, {});
    cyl(0.024, 0.048, 0.09, 12, MAT.rubber, driveG, 0.54, 0.338, 1.335, null, {});
    box(0.06, 0.04, 0.06, MAT.iron, driveG, 0.045, 0.352, 1.30, '中间轴轴承座');
  })();

  (function buildSuspension() {
    box(0.9, 0.07, 0.30, MAT.iron, suspG, 0, 0.285, 1.16, '前副车架');
    box(0.95, 0.09, 0.32, MAT.iron, suspG, 0, 0.30, -1.28, '后副车架(多连杆基座)');
    cyl(0.02, 0.02, 1.0, 12, MAT.aluDark, suspG, 0, 0.335, 1.235, '电动助力转向齿条', { axis: 'X' });
    cyl(0.013, 0.013, 1.02, 10, MAT.steel, suspG, 0, 0.29, 1.10, '前防倾杆', { axis: 'X' });
    cyl(0.013, 0.013, 0.92, 10, MAT.steel, suspG, 0, 0.315, -1.18, '后防倾杆', { axis: 'X' });
    for (const s of [1, -1]) {
      tubeBetween(V(s * 0.46, 0.30, 1.10), V(s * 0.50, 0.302, 1.22), 0.009, undefined, MAT.steel, suspG, null, { cast: false });
      tubeBetween(V(s * 0.44, 0.315, -1.18), V(s * 0.44, 0.355, -1.07), 0.009, undefined, MAT.steel, suspG, null, { cast: false });
      box(0.07, 0.14, 0.09, MAT.aluDark, suspG, s * 0.635, 0.36, 1.345, s > 0 ? '转向节(右)' : '转向节(左)');
      cyl(0.05, 0.05, 0.06, 14, MAT.aluDark, suspG, s * 0.66, 0.335, 1.35, '前轮轮毂', { axis: 'X' });
      tubeBetween(V(s * 0.56, 0.715, 1.30), V(s * 0.635, 0.39, 1.34), 0.027, undefined, MAT.gloss, suspG, '前麦弗逊减震筒', { seg: 14 });
      spring(V(s * 0.555, 0.68, 1.295), V(s * 0.615, 0.42, 1.325), 0.075, 5.5, 0.013, MAT.springM, suspG, '前螺旋弹簧');
      tubeBetween(V(s * 0.26, 0.295, 1.14), V(s * 0.61, 0.305, 1.315), 0.023, undefined, MAT.iron, suspG, '前下摆臂(LCA)', { seg: 10 });
      tubeBetween(V(s * 0.10, 0.335, 1.235), V(s * 0.60, 0.345, 1.30), 0.011, undefined, MAT.steel, suspG, '转向横拉杆');
      cyl(0.152, 0.152, 0.024, 26, MAT.steel, suspG, s * 0.655, 0.335, 1.35, '前通风制动盘', { axis: 'X' });
      cyl(0.07, 0.07, 0.026, 16, MAT.aluDark, suspG, s * 0.655, 0.335, 1.35, null, { axis: 'X' });
      box(0.055, 0.13, 0.16, MAT.caliper, suspG, s * 0.668, 0.425, 1.245, '前 Brembo 对向四活塞卡钳');
      box(0.07, 0.13, 0.09, MAT.aluDark, suspG, s * 0.645, 0.36, -1.42, '后多连杆转向节');
      cyl(0.048, 0.048, 0.06, 14, MAT.aluDark, suspG, s * 0.665, 0.335, -1.42, '后轮轮毂', { axis: 'X' });
      tubeBetween(V(s * 0.40, 0.36, -1.28), V(s * 0.55, 0.76, -1.50), 0.026, undefined, MAT.gloss, suspG, '后减震器', { seg: 14 });
      spring(V(s * 0.40, 0.385, -1.285), V(s * 0.545, 0.73, -1.49), 0.072, 5, 0.012, MAT.springM, suspG, '后螺旋弹簧');
      tubeBetween(V(s * 0.27, 0.30, -1.24), V(s * 0.62, 0.31, -1.40), 0.022, undefined, MAT.iron, suspG, '后下控制臂', { seg: 10 });
      tubeBetween(V(s * 0.30, 0.50, -1.28), V(s * 0.62, 0.455, -1.40), 0.016, undefined, MAT.iron, suspG, '后上控制臂');
      tubeBetween(V(s * 0.22, 0.335, -1.60), V(s * 0.62, 0.335, -1.455), 0.012, undefined, MAT.steel, suspG, '后束角调整连杆(Toe Link)');
      tubeBetween(V(s * 0.44, 0.36, -1.06), V(s * 0.645, 0.36, -1.38), 0.016, undefined, MAT.iron, suspG, '后纵臂(Trailing Arm)');
      cyl(0.142, 0.142, 0.022, 26, MAT.steel, suspG, s * 0.66, 0.335, -1.42, '后制动盘', { axis: 'X' });
      box(0.045, 0.10, 0.13, MAT.caliper, suspG, s * 0.672, 0.415, -1.335, '后单活塞卡钳');
    }
  })();

  (function buildFuelBattery() {
    box(0.58, 0.15, 0.52, MAT.tank, fuelG, 0, 0.365, -0.80, '燃油箱(后座下方)');
    pipe([V(0.30, 0.40, -0.60), V(0.55, 0.45, -0.55), V(0.72, 0.52, -0.52)], 0.022, MAT.plastic, fuelG, '燃油加注管', { cast: false });
    box(0.19, 0.15, 0.26, MAT.gloss, battG, -0.52, 0.475, 1.06, '蓄电池(12V)');
    cyl(0.012, 0.012, 0.02, 10, MAT.vcover, battG, -0.455, 0.555, 1.00, '电瓶正极', { axis: 'Y' });
    cyl(0.012, 0.012, 0.02, 10, MAT.aluDark, battG, -0.585, 0.555, 1.12, null, { axis: 'Y' });
    box(0.12, 0.06, 0.17, MAT.plastic, battG, 0.52, 0.505, 1.10, '保险丝盒');
  })();

  function makeWheel(s, az) {
    const g = new THREE.Group();
    g.position.set(s * TRACK, 0.335, az);
    g.userData.basePos = g.position.clone();
    g.userData.rot = ['x', s * 0.55];
    EXP.push({ o: g, d: V(s * 0.55, 0, 0) });
    const tireG = new THREE.CylinderGeometry(0.335, 0.335, 0.245, 30, 1);
    tireG.rotateZ(Math.PI / 2);
    reg(new THREE.Mesh(tireG, MAT.rubber), g, s * az > 0 ? '265/30 R19 半热熔胎' : null, {});
    const swG = new THREE.TorusGeometry(0.283, 0.054, 10, 30);
    swG.rotateY(Math.PI / 2);
    const sw = new THREE.Mesh(swG, MAT.rubber);
    sw.position.x = s * 0.058;
    reg(sw, g, null, {});
    const faceX = s * 0.128;
    const barrelG = new THREE.CylinderGeometry(0.225, 0.225, 0.14, 24, 1, true);
    barrelG.rotateZ(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelG, MAT.rimDS);
    barrel.position.x = s * 0.03;
    reg(barrel, g, '19寸锻造轮毂外圈', {});
    const plateG = new THREE.CylinderGeometry(0.212, 0.212, 0.012, 24, 1);
    plateG.rotateZ(Math.PI / 2);
    const plate = new THREE.Mesh(plateG, MAT.plastic);
    plate.position.x = s * 0.045;
    reg(plate, g, null, { cast: false });
    const lipG = new THREE.TorusGeometry(0.218, 0.016, 8, 28);
    lipG.rotateY(Math.PI / 2);
    const lip = new THREE.Mesh(lipG, MAT.rim);
    lip.position.x = faceX;
    reg(lip, g, null, {});
    for (let i = 0; i < 5; i++) {
      const ang = i / 5 * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.21, 0.062), MAT.spoke);
      sp.position.set(faceX, 0.115 * Math.cos(ang), 0.115 * Math.sin(ang));
      sp.rotation.x = ang;
      reg(sp, g, '19寸五辐抛光银轮毂', { cast: false });
    }
    const hubG = new THREE.CylinderGeometry(0.055, 0.055, 0.035, 16, 1);
    hubG.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubG, MAT.spoke);
    hub.position.x = faceX + s * 0.008;
    reg(hub, g, null, {});
    const capG = new THREE.CylinderGeometry(0.024, 0.024, 0.012, 12, 1);
    capG.rotateZ(Math.PI / 2);
    const cap = new THREE.Mesh(capG, MAT.vcover);
    cap.position.x = faceX + s * 0.028;
    reg(cap, g, '红色R标轮毂中心盖', { cast: false });
    for (let i = 0; i < 5; i++) {
      const ang = i / 5 * Math.PI * 2 + 0.31;
      const lugG = new THREE.CylinderGeometry(0.011, 0.011, 0.02, 8, 1);
      lugG.rotateZ(Math.PI / 2);
      const lug = new THREE.Mesh(lugG, MAT.blueAnod);
      lug.position.set(faceX + s * 0.012, 0.032 * Math.cos(ang), 0.032 * Math.sin(ang));
      reg(lug, g, null, { cast: false });
    }
    scene.add(g);
    return g;
  }
  const WHEEL_GS = [makeWheel(1, AXLE_F), makeWheel(-1, AXLE_F), makeWheel(1, AXLE_R), makeWheel(-1, AXLE_R)];

  makePin(0, engineG, -0.02, 0.80, 1.00);
  makePin(1, turboG, 0.115, 0.58, 1.315);
  makePin(2, chargeG, 0, 0.56, 1.74);
  makePin(3, driveG, -0.52, 0.60, 0.985);
  makePin(4, suspG, 0.605, 0.585, 1.31);
  makePin(5, suspG, 0.72, 0.47, 1.245);
  makePin(6, exhaustG, 0, 0.37, -2.30);
  makePin(7, interiorG, 0, 1.02, -0.66);

  const PN = 420;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PN * 3);
  const pVel = new Float32Array(PN * 3);
  const pLife = new Float32Array(PN);
  function spawnP(i) {
    const tipX = [-0.11, 0, 0.11][i % 3];
    pPos[i * 3] = tipX + (Math.random() - 0.5) * 0.05;
    pPos[i * 3 + 1] = 0.255 + (Math.random() - 0.5) * 0.05;
    pPos[i * 3 + 2] = -2.38 - Math.random() * 0.05;
    pVel[i * 3] = (Math.random() - 0.5) * 0.25 + tipX * 1.2;
    pVel[i * 3 + 1] = 0.15 + Math.random() * 0.35;
    pVel[i * 3 + 2] = -(0.9 + Math.random() * 0.9);
    pLife[i] = 0.6 + Math.random() * 0.5;
  }
  for (let i = 0; i < PN; i++) { spawnP(i); pPos[i * 3 + 2] += Math.random() * 1.2; }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xffc890, size: 0.02, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false });
  const particles = new THREE.Points(pGeo, pMat);
  particles.visible = false;
  particles.frustumCulled = false;
  exhaustG.add(particles);
  let pAccum = 0;
  function stepParticles(dt) {
    if (!particlesActive || !particles.visible) return;
    pAccum += dt;
    for (let i = 0; i < PN; i++) {
      pLife[i] -= dt;
      pPos[i * 3] += pVel[i * 3] * dt;
      pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
      pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      pVel[i * 3 + 1] -= dt * 0.12;
      if (pLife[i] <= 0 || pPos[i * 3 + 2] < -3.6) {
        spawnP(i);
        if (pAccum > 0.1 && Math.random() < 0.35) { pLife[i] = -1; pPos[i * 3 + 2] = -99; }
      }
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  let xrayV = 0, explodeV = 0, prevSavedXray = 0;
  function applyXray(t) {
    xrayV = THREE.MathUtils.clamp(t, 0, 1);
    const o = lerp(1, 0.05, xrayV);
    SHELL_MATS.forEach(m => { m.opacity = o; m.depthWrite = o > 0.5; });
    for (const m of SHELL_MESHES) m.castShadow = o > 0.5;
    for (const m of GLB_SHELL_MATS) {
      m.opacity = o;
      m.depthWrite = o > 0.985;
      m.needsUpdate = false;
    }
    MAT.biw.opacity = Math.max(0, (xrayV - 0.3) / 0.7) * 0.92;
    MAT.biw.visible = MAT.biw.opacity > 0.02;
  }
  function applyExplode(t) {
    explodeV = THREE.MathUtils.clamp(t, 0, 1);
    for (const e of EXP) {
      e.o.position.copy(e.o.userData.basePos || e.o.position).addScaledVector(e.d, explodeV);
      const r = e.o.userData.rot;
      if (r) {
        if (!e.o.userData.baseRot) e.o.userData.baseRot = { x: e.o.rotation.x, y: e.o.rotation.y, z: e.o.rotation.z };
        const b = e.o.userData.baseRot;
        e.o.rotation.set(
          b.x + (r[0] === 'x' ? r[1] * explodeV : 0),
          b.y + (r[0] === 'y' ? r[1] * explodeV : 0),
          b.z + (r[0] === 'z' ? r[1] * explodeV : 0));
      }
    }
  }
  for (const e of EXP) if (!e.o.userData.basePos) e.o.userData.basePos = e.o.position.clone();

  const $ = id => document.getElementById(id);
  const xrSlider = $('xr'), exSlider = $('ex'), btnTour = $('btnTour'), btnReset = $('btnReset');
  const stationEl = $('station'), tipEl = $('tip'), loaderEl = $('loader'), errBox = $('errbox');
  xrSlider.addEventListener('input', () => { if (!touring && !tween) { prevSavedXray = xrSlider.value / 100; } applyXray(xrSlider.value / 100); });
  exSlider.addEventListener('input', () => applyExplode(exSlider.value / 100));

  function camTo(p, t) {
    introDone = true;
    camera.position.set(p[0], p[1], p[2]);
    controls.target.set(t[0], t[1], t[2]);
    controls.update();
  }
  const VIEWS = {
    exterior() { setExplodeUI(0); setXrayUI(prevSavedXray = 0); camTo([4.7, 2.85, 5.55], [0, 0.62, 0]); },
    engine() { setExplodeUI(0); setXrayUI(prevSavedXray = 0.85); camTo([1.25, 0.95, 2.45], [0, 0.55, 1.05]); },
    chassis() { setXrayUI(prevSavedXray = 0.25); setExplodeUI(0.55); camTo([2.6, 0.55, 3.3], [0, 0.28, 0]); },
    cabin() { setExplodeUI(0); setXrayUI(prevSavedXray = 0.8); camTo([2.9, 1.75, -3.3], [0, 0.55, -0.35]); }
  };
  function setXrayUI(v) { xrSlider.value = Math.round(v * 100); applyXray(v); }
  function setExplodeUI(v) { exSlider.value = Math.round(v * 100); applyExplode(v); }

  const CHAPTERS = [
    { name: '外观总览', en: 'OVERVIEW', pos: [4.7, 2.85, 5.55], tgt: [0, 0.62, 0], xray: 0, explode: 0,
      desc: '竞速红金属漆车身,Type R 空力套件一应俱全:前唇、侧裙、巨型尾翼与中置三出排气。',
      chips: ['FL5 · 前驱钢炮', '6速手动', '320PS'] },
    { name: 'K20C1 发动机', en: 'ENGINE', pos: [1.15, 0.95, 2.45], tgt: [-0.02, 0.55, 1.02], xray: 0.88, explode: 0,
      desc: '2.0T 直列四缸,i-VTEC 双可变气门正时。强化曲轴与轻量活塞,红线 7000rpm 迸发 320 马力。',
      chips: ['320PS/6500rpm', '420N·m', 'i-VTEC'] },
    { name: '涡轮增压系统', en: 'TURBO SYSTEM', pos: [1.05, 0.72, 2.35], tgt: [0.12, 0.45, 1.5], xray: 0.9, explode: 0,
      desc: '单涡管涡轮集成电泄压阀,高温废气驱动叶轮,增压空气经前置中冷器冷却后灌入燃烧室。',
      chips: ['单涡管涡轮', '电泄压阀', '前置中冷'] },
    { name: '6MT 传动', en: 'TRANSMISSION', pos: [-2.3, 0.95, 1.75], tgt: [-0.5, 0.42, 1.0], xray: 0.82, explode: 0.22,
      desc: '横置 6 速手动变速箱与发动机并排布局,短行程换挡配合自动补油,动力零损耗直达前轮。',
      chips: ['6MT 手动', 'Rev Match', '限滑差速器'] },
    { name: '悬挂系统', en: 'SUSPENSION', pos: [2.5, 0.55, 3.0], tgt: [0.55, 0.35, 0.2], xray: 0.45, explode: 0.45,
      desc: '前双球头麦弗逊搭配后多连杆,自适应阻尼减震器毫秒级调节,弯中姿态干净利落。',
      chips: ['双球头麦弗逊', '多连杆', '自适应阻尼'] },
    { name: '制动系统', en: 'BRAKES', pos: [1.95, 0.5, 2.4], tgt: [0.76, 0.37, 1.34], xray: 0.15, explode: 0,
      desc: 'Brembo 对向四活塞卡钳钳制大尺寸通风盘,19 寸锻造轮毂辐条间清晰可见红色卡钳。',
      chips: ['Brembo 4活塞', '通风盘', '265/30 R19'] },
    { name: '排气系统', en: 'EXHAUST', pos: [0.9, 0.5, -3.3], tgt: [0, 0.27, -2.3], xray: 0.75, explode: 0,
      desc: '中置三出排气是 Type R 的标志性符号,电控阀门低转静音、高转全开,声浪浑厚纯粹。',
      chips: ['中置三出', '电控阀门', '粒子演示'], fx: true },
    { name: '底盘与座舱', en: 'CHASSIS & COCKPIT', pos: [2.9, 1.75, -3.3], tgt: [0, 0.55, -0.35], xray: 0.8, explode: 0.3,
      desc: '白车身关键部位结构粘接增强,抗扭刚性大幅提升;红黑桶椅与平底方向盘营造战斗座舱。',
      chips: ['车身刚性增强', 'Recaro 桶椅', '平底方向盘'] }
  ];

  let tween = null;
  function tweenCam(pos, tgt, xr, ex, dur, done) {
    introDone = true;
    if (touring) stopTour();
    tween = { t0: performance.now(), dur: dur || 1600, p0: camera.position.clone(), q0: controls.target.clone(),
      p1: V(pos[0], pos[1], pos[2]), t1: V(tgt[0], tgt[1], tgt[2]), xr0: xrayV, ex0: explodeV, xr1: xr, ex1: ex, done };
    controls.enabled = false;
    controls.autoRotate = false;
  }

  let activeChapter = -1, demoMode = false, particlesActive = false;
  const cardEl = document.getElementById('infoCard');
  const navRow = document.getElementById('navRow');
  const btnDemo = document.getElementById('btnDemo');
  const navCount = document.getElementById('chCount');
  const dotsWrap = document.getElementById('navDots');
  const dotEls = [];
  for (let i = 0; i < 8; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    d.addEventListener('click', () => gotoChapter(i));
    dotsWrap.appendChild(d);
    dotEls.push(d);
  }
  function setCard(i) {
    const c = CHAPTERS[i];
    cardEl.innerHTML = '<div class="ch">章节 ' + (i + 1) + ' / 8 · <span class="en">' + c.en + '</span></div>' +
      '<h3>' + (i + 1) + '. ' + c.name + '</h3><p>' + c.desc + '</p>' +
      '<div class="chips">' + c.chips.map(x => '<span class="chip">' + x + '</span>').join('') + '</div>';
  }
  function refreshNav() {
    dotEls.forEach((d, k) => d.classList.toggle('on', k === activeChapter));
    navCount.textContent = activeChapter >= 0 ? (activeChapter + 1) + '/8' : '-/8';
    PINS.forEach(p => p.el.classList.toggle('active', p.idx === activeChapter));
  }
  function setPins(v) { PINS.forEach(p => p.o.visible = v); }
  function gotoChapter(i) {
    demoMode = true;
    btnDemo.textContent = '⏹ 退出演示';
    navRow.style.display = 'flex';
    activeChapter = i;
    const c = CHAPTERS[i];
    setCard(i);
    cardEl.classList.add('on');
    particlesActive = !!c.fx;
    setPins(true);
    tweenCam(c.pos, c.tgt, c.xray, c.explode, 1600, () => refreshNav());
    refreshNav();
  }
  function exitChapter() {
    activeChapter = -1;
    particlesActive = false;
    cardEl.classList.remove('on');
    refreshNav();
  }
  btnDemo.addEventListener('click', () => {
    if (!demoMode) gotoChapter(0);
    else { demoMode = false; btnDemo.textContent = '▶ 拆解演示'; exitChapter(); }
  });
  window.addEventListener('keydown', e => {
    if (!demoMode) return;
    if (e.key === 'ArrowRight') gotoChapter((activeChapter + 1) % 8);
    else if (e.key === 'ArrowLeft') gotoChapter((activeChapter + 7) % 8);
  });

  function makePin(idx, parent, x, y, z) {
    const el = document.createElement('div');
    el.className = 'pin';
    el.textContent = String(idx + 1);
    el.addEventListener('click', ev => { ev.stopPropagation(); gotoChapter(idx); });
    const o = new CSS2DObject(el);
    o.position.set(x, y, z);
    parent.add(o);
    PINS.push({ idx, el, o });
  }


  const TOUR = [
    { name: '外观 · 整车环绕', dur: 9, orbit: { c: [0, 0.62, 0], a0: 2.4, a1: -2.4, r0: 6.4, r1: 5.2, y0: 2.3, y1: 1.5 }, inside: false },
    { name: '俯冲 · 进入发动机舱', dur: 4.5, keys: [
      { p: [3.6, 1.9, 4.4], t: [0, 0.62, 0] },
      { p: [1.9, 1.15, 3.1], t: [0.1, 0.6, 1.15] },
      { p: [1.05, 0.88, 2.5], t: [0, 0.55, 1.1] }], inside: true },
    { name: 'K20C1 2.0T 直列四缸涡轮增压发动机', dur: 7, orbit: { c: [0, 0.57, 1.02], a0: 3.6, a1: 5.9, r0: 1.0, r1: 0.72, y0: 0.95, y1: 0.72 }, inside: true },
    { name: '涡轮增压器 · 中冷器与增压管路', dur: 5, orbit: { c: [0, 0.45, 1.55], a0: 0.5, a1: 1.5, r0: 1.15, r1: 0.85, y0: 0.62, y1: 0.5 }, inside: true },
    { name: '沿排气系统 · 驶向车尾', dur: 6.5, keys: [
      { p: [0.95, 0.38, 1.5], t: [0.1, 0.25, 1.0] },
      { p: [0.85, 0.33, 0.2], t: [0, 0.205, 0.1] },
      { p: [0.75, 0.30, -1.0], t: [0, 0.215, -1.3] },
      { p: [1.15, 0.5, -3.0], t: [0, 0.3, -2.25] }], inside: true },
    { name: '中置三出排气与后扩散器', dur: 4.5, orbit: { c: [0, 0.30, -2.25], a0: 3.3, a1: 2.9, r0: 1.05, r1: 0.85, y0: 0.45, y1: 0.38 }, inside: true },
    { name: '底盘 · 悬挂与制动系统', dur: 7, keys: [
      { p: [1.9, 0.30, 2.7], t: [0.7, 0.33, 1.35] },
      { p: [0, 0.26, 2.3], t: [0, 0.26, 0] },
      { p: [-1.9, 0.30, -2.5], t: [-0.7, 0.33, -1.42] },
      { p: [2.2, 0.55, -3.1], t: [0, 0.32, -1.4] }], inside: true },
    { name: '回到外观 · Honda Civic Type R FL5', dur: 5, keys: [
      { p: [2.2, 0.55, -3.1], t: [0, 0.62, 0] },
      { p: [4.0, 1.8, 3.2], t: [0, 0.62, 0] },
      { p: [4.7, 2.85, 5.55], t: [0, 0.62, 0] }], inside: false }
  ];
  let touring = false, tourIdx = 0, tourStart = 0;
  let userTouched = false, introDone = false, introT0 = 0;
  let bootGate = false;
  function markReady() {
    if (readySent) return;
    readySent = true;
    FL5.ready = true;
    FL5.phase = 'ready';
    loaderEl.style.display = 'none';
  }
  const introFrom = V(9.8, 4.9, 11.0), introTo = V(4.7, 2.85, 5.55);
  const tmpV = new THREE.Vector3();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  function stationSample(st, u) {
    if (st.orbit) {
      const e = ease(u), o = st.orbit;
      const a = lerp(o.a0, o.a1, e), r = lerp(o.r0, o.r1, e), y = lerp(o.y0, o.y1, e);
      return { p: [o.c[0] + r * Math.cos(a), y, o.c[2] + r * Math.sin(a)], t: o.c.slice() };
    }
    const ks = st.keys;
    const seg = Math.min(ks.length - 2, Math.floor(u * (ks.length - 1)));
    const lu = u * (ks.length - 1) - seg;
    const e = ease(lu);
    const A = ks[seg], B = ks[seg + 1];
    return {
      p: [lerp(A.p[0], B.p[0], e), lerp(A.p[1], B.p[1], e), lerp(A.p[2], B.p[2], e)],
      t: [lerp(A.t[0], B.t[0], e), lerp(A.t[1], B.t[1], e), lerp(A.t[2], B.t[2], e)]
    };
  }
  function enterStation(i) {
    tourIdx = i;
    const st = TOUR[i];
    stationEl.textContent = '▸ ' + st.name + '  (' + (i + 1) + '/' + TOUR.length + ')';
    stationEl.classList.add('on');
    if (st.inside) setXrayUI(0.88);
    else setXrayUI(prevSavedXray);
  }
  function startTour() {
    touring = true;
    setPins(false);
    btnTour.textContent = '⏸ 退出运镜';
    controls.enabled = false;
    enterStation(0);
    tourStart = performance.now();
  }
  function stopTour() {
    touring = false;
    btnTour.textContent = '▶ 运镜模式';
    stationEl.classList.remove('on');
    controls.enabled = true;
    setXrayUI(prevSavedXray);
    controls.target.copy(lastTarget);
    controls.update();
    controls.autoRotate = !userTouched;
    setPins(true);
  }
  btnTour.addEventListener('click', () => touring ? stopTour() : startTour());
  btnReset.addEventListener('click', () => { if (touring) stopTour(); setXrayUI(0); setExplodeUI(0); camTo([4.7, 2.85, 5.55], [0, 0.62, 0]); });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downXY = null;
  let tipTimer = null;
  let tipMesh = null;
  renderer.domElement.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; userTouched = true; introDone = true; controls.autoRotate = false; });
  renderer.domElement.addEventListener('wheel', () => { userTouched = true; introDone = true; controls.autoRotate = false; }, { passive: true });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downXY) return;
    const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1];
    downXY = null;
    if (dx * dx + dy * dy > 36 || touring) return;
    ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const pool = PARTS.filter(m => {
      if (!m.visible) return false;
      let n = m;
      while (n) { if (n.userData.noPick) return false; n = n.parent; }
      if (SHELL_MESHES.includes(m) && xrayV > 0.3) return false;
      return true;
    });
    const hits = raycaster.intersectObjects(pool, false);
    if (!hits.length) { tipEl.style.display = 'none'; tipMesh = null; return; }
    tipMesh = hits[0].object;
    tipEl.textContent = hits[0].object.userData.label;
    tipEl.style.display = 'block';
    tipEl.style.left = Math.min(e.clientX + 14, window.innerWidth - tipEl.offsetWidth - 12) + 'px';
    tipEl.style.top = Math.max(e.clientY - 40, 10) + 'px';
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { tipEl.style.display = 'none'; tipMesh = null; }, 2600);
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  const lastTarget = new THREE.Vector3(0, 0.62, 0);
  FL5.parts = PARTS.map(m => m.userData.label);
  FL5.api = {
    setView(name) { if (touring) stopTour(); (VIEWS[name] || VIEWS.exterior)(); },
    setXray: v => setXrayUI(v),
    setExplode: v => setExplodeUI(v),
    tour(on) { on ? startTour() : stopTour(); },
    cam() { return { p: camera.position.toArray(), t: controls.target.toArray() }; },
    setCam(p, t) { camTo(p, t); },
    pickNDC(nx, ny) {
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
      const hits = raycaster.intersectObjects(PARTS.filter(m => m.visible), false);
      return hits.slice(0, 3).map(h => h.object.userData.label).filter(Boolean);
    },
    glassInfo() {
      if (!glassGeo) return null;
      const p = glassGeo.attributes.position;
      let minX = 9, maxX = -9;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      return { bendX: +(maxX - minX).toFixed(4), halfW: +maxX.toFixed(4) };
    },
    debugScene() {
      let meshes = 0;
      scene.traverse(o => { if (o.isMesh) meshes++; });
      return {
        meshes,
        shadowsEnabled: renderer.shadowMap.enabled,
        shadowMapSize: key.shadow.mapSize.x,
        aoVisible: aoBlob.visible,
        groundReceive: ground.receiveShadow,
        keyCast: key.castShadow
      };
    },
    toggleAO() { aoBlob.visible = !aoBlob.visible; return aoBlob.visible; },
    dbg(flag) {
      if (flag === 'ground') { ground.visible = !ground.visible; return ground.visible; }
      if (flag === 'aoScale') { aoBlob.scale.setScalar(aoBlob.scale.x > 1 ? 1 : 40); return aoBlob.scale.x; }
      if (flag === 'aoColor') { aoBlob.material.color.set(0xff0000); return true; }
      return null;
    },
    chapter(i) { gotoChapter(i); },
    demo(on) {
      if (on) gotoChapter(0);
      else { demoMode = false; btnDemo.textContent = '▶ 拆解演示'; exitChapter(); controls.enabled = true; tween = null; }
    },
    chapterIdx: () => activeChapter,
    particlesOn: () => particlesActive,
    pinsCount: () => PINS.length,
    wheelTilt() { const w = EXP.find(e => e.o.userData.rot && e.o.userData.rot[0] === 'x'); return w ? +w.o.rotation.x.toFixed(3) : 0; }
  };

  (function initShellSwap() {
    const SHELL_URL = 'models/fl5.glb';
    const t2 = document.querySelector('#loader .t2');
    const finish = () => { bootGate = true; if (!readySent) markReady(); };
    setTimeout(finish, 20000);
    fetch(SHELL_URL, { method: 'HEAD' }).then(r => {
      if (!r.ok) { finish(); return; }
      if (t2) t2.textContent = '正在加载真车网格 0%';
      const mgr = new THREE.LoadingManager();
      mgr.onProgress = (u, l, t) => { if (t > 0 && t2) t2.textContent = '正在加载真车网格 ' + Math.round(l / t * 100) + '%'; };
      new GLTFLoader(mgr).load(SHELL_URL,
        g => { try { applyGLBShell(g); finish(); } catch (e) { errPush('glb apply: ' + e.message); finish(); } },
        undefined,
        () => finish());
    }).catch(() => finish());
  })();

  function applyGLBShell(gltf) {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(root);
    let size = box.getSize(new THREE.Vector3());
    if (size.x > size.z) {
      root.rotation.y = Math.PI / 2;
      root.updateMatrixWorld(true);
      box.setFromObject(root);
      size = box.getSize(new THREE.Vector3());
    }
    FL5.stats.glbRaw = [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)];
    root.scale.setScalar(4.59 / size.z);
    root.updateMatrixWorld(true);

    const shellKeys = /paint|coloured|carbon|base_material|grille|light|licenseplate|badge/i;
    const rimKey = /rim/i, tireKey = /toyo/i, discKey = /brakedisc/i;
    const wheelMeshes = [];
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.map) m.map.anisotropy = 4;
        const nm = (m.name || '') + ' ';
        if (shellKeys.test(nm)) {
          m.transparent = true;
          if (!GLB_SHELL_MATS.includes(m)) GLB_SHELL_MATS.push(m);
        } else if (rimKey.test(nm) || tireKey.test(nm) || discKey.test(nm)) {
          if (!wheelMeshes.includes(o)) wheelMeshes.push(o);
        }
      }
    });

    const wp = [];
    for (const o of wheelMeshes) {
      const bb = new THREE.Box3().setFromObject(o);
      if (bb.isEmpty()) continue;
      const c = bb.getCenter(new THREE.Vector3());
      const sz = bb.getSize(new THREE.Vector3());
      if (!isFinite(c.x) || sz.length() > 1.5) continue;
      wp.push(c);
    }
    FL5.stats.glbWheelPts = wp.length;
    let aligned = false;
    try {
      const keyOf = q => Math.round(q.x / 0.06) + '_' + Math.round(q.z / 0.06);
      const uniq = new Map();
      for (const q of wp) { const k = keyOf(q); if (!uniq.has(k)) uniq.set(k, q.clone()); }
      const pts = [...uniq.values()];
      if (pts.length >= 4 && isFinite(pts[0].x)) {
        pts.sort((a, b) => b.z - a.z);
        const frontZ = [], rearZ = [];
        const midZ = (pts[0].z + pts[pts.length - 1].z) / 2;
        for (const q of pts) (q.z > midZ ? frontZ : rearZ).push(q);
        const avg = a => a.reduce((t, v) => t + v, 0) / a.length;
        if (frontZ.length && rearZ.length) {
          const zf = avg(frontZ.map(q => q.z)), zr = avg(rearZ.map(q => q.z));
          const xs = pts.map(q => q.x);
          const xl = Math.min(...xs), xr = Math.max(...xs);
          const yh = avg(pts.map(q => q.y));
          const wb = Math.abs(zf - zr);
          if (wb > 0.8 && isFinite(wb) && xr - xl > 0.8) {
            const s2 = 2.77 / wb;
            root.scale.multiplyScalar(s2);
            root.updateMatrixWorld(true);
            const dy = 0.335 - yh * s2;
            const dz = -0.035 - ((zf + zr) / 2) * s2;
            const dx = -(xl + xr) / 2 * s2;
            if ([dx, dy, dz].every(isFinite)) {
              root.position.set(dx, dy, dz);
              root.updateMatrixWorld(true);
              aligned = true;
              FL5.stats.glbAlign = { wb: +wb.toFixed(2), s2: +s2.toFixed(3), dx: +dx.toFixed(3), dy: +dy.toFixed(3), dz: +dz.toFixed(3) };
            }
          }
        }
      }
    } catch (e) { errPush('glb align: ' + e.message); }
    if (!aligned) {
      root.updateMatrixWorld(true);
      const b2 = new THREE.Box3().setFromObject(root);
      const c2 = b2.getCenter(new THREE.Vector3());
      root.position.set(-c2.x, -b2.min.y, -c2.z);
      root.updateMatrixWorld(true);
    }
    box.setFromObject(root);
    size = box.getSize(new THREE.Vector3());
    FL5.stats.glbFinal = [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)];

    shellRootG = new THREE.Group();
    scene.add(shellRootG);
    shellRootG.add(root);
    shellRootG.userData.basePos = shellRootG.position.clone();
    EXP.push({ o: shellRootG, d: V(0, 1.25, 0) });

    const corners = [[1, AXLE_F], [-1, AXLE_F], [1, AXLE_R], [-1, AXLE_R]];
    for (const [sgn, az] of corners) {
      const pv = new THREE.Group();
      pv.position.set(sgn * TRACK, 0.335, az);
      scene.add(pv);
      for (const m of wheelMeshes) {
        const p = new THREE.Vector3();
        m.getWorldPosition(p);
        if (p.distanceTo(pv.position) < 0.5) pv.attach(m);
      }
      pv.userData.basePos = pv.position.clone();
      pv.userData.rot = ['x', sgn * 0.55];
      EXP.push({ o: pv, d: V(sgn * 0.55, 0, 0) });
    }

    bodyG.visible = false;
    for (const w of WHEEL_GS) w.visible = false;
    interiorG.visible = false;

    if (PINS[7] && PINS[7].o.parent !== root) {
      const wp7 = new THREE.Vector3();
      PINS[7].o.getWorldPosition(wp7);
      root.attach(PINS[7].o);
      PINS[7].o.position.copy(root.worldToLocal(wp7));
    }

    shellMode = 'glb';
    FL5.shellMode = 'glb';
  }

  let frames = 0, lastStat = performance.now(), readySent = false;
  function tick(now) {
    requestAnimationFrame(tick);
    try {
      if (tween) {
        let u = Math.min((now - tween.t0) / tween.dur, 1);
        const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        camera.position.lerpVectors(tween.p0, tween.p1, e);
        lastTarget.lerpVectors(tween.q0, tween.t1, e);
        camera.lookAt(lastTarget);
        applyXray(lerp(tween.xr0, tween.xr1, e));
        applyExplode(lerp(tween.ex0, tween.ex1, e));
        xrSlider.value = Math.round(xrayV * 100);
        exSlider.value = Math.round(explodeV * 100);
        if (u >= 1) { controls.target.copy(tween.t1); controls.enabled = true; const d = tween.done; tween = null; if (d) d(); }
      } else if (touring) {
        const st = TOUR[tourIdx];
        let u = (now - tourStart) / (st.dur * 1000);
        if (u >= 1) {
          if (tourIdx < TOUR.length - 1) { tourStart = now; enterStation(tourIdx + 1); u = 0; }
          else { stopTour(); }
        }
        if (touring) {
          const s = stationSample(TOUR[tourIdx], Math.min(u, 1));
          camera.position.set(s.p[0], s.p[1], s.p[2]);
          lastTarget.set(s.t[0], s.t[1], s.t[2]);
          camera.lookAt(lastTarget);
        }
      } else if (!introDone && bootGate) {
        if (!introT0) introT0 = now;
        const u = Math.min((now - introT0) / 3200, 1);
        const e = 1 - Math.pow(1 - u, 3);
        camera.position.lerpVectors(introFrom, introTo, e);
        controls.target.set(0, 0.62, 0);
        lastTarget.copy(controls.target);
        camera.lookAt(lastTarget);
        if (u >= 1) introDone = true;
      } else {
        controls.update();
        lastTarget.copy(controls.target);
      }
      if (tipEl.style.display === 'block' && tipMesh) {
        tmpV.setFromMatrixPosition(tipMesh.matrixWorld).project(camera);
        const sx = (tmpV.x + 1) / 2 * window.innerWidth;
        const sy = (1 - tmpV.y) / 2 * window.innerHeight;
        tipEl.style.left = Math.min(Math.max(sx + 12, 8), window.innerWidth - tipEl.offsetWidth - 8) + 'px';
        tipEl.style.top = Math.min(Math.max(sy - 40, 8), window.innerHeight - 50) + 'px';
      }
      particles.visible = particlesActive;
      stepParticles(0.016);
      if (FL5.errs.length < 40) {
        renderer.info.reset();
        composer.render();
        labelRenderer.render(scene, camera);
        frames++;
        if (now - lastStat >= 1000) {
          FL5.stats.fps = frames;
          FL5.stats.tris = renderer.info.render.triangles;
          frames = 0; lastStat = now;
        }
      }

    } catch (e) {
      errPush('tick: ' + ((e && e.message) || e));
    }
  }
  requestAnimationFrame(tick);
}

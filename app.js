// Golden Rock — Interactive 3D viewer. Self-hosted, CSP-safe (external ESM only, no inline, no CDN).
// Device-gated like the brand gem: desktop + fine pointer + WebGL2 + not Save-Data. three is dynamic-imported
// only when the gate passes, so phones and metered connections never fetch the 1.3 MB engine.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine   = matchMedia("(pointer: fine)").matches;
const wide   = matchMedia("(min-width: 900px)").matches;
const save   = !!(navigator.connection && navigator.connection.saveData);
let gl2 = false; try { gl2 = !!document.createElement("canvas").getContext("webgl2"); } catch (e) { gl2 = false; }

const $ = (id) => document.getElementById(id);
const stage = $("stage"), pinLayer = $("pins"), panel = $("panel"), fallback = $("fallback"), hint = $("hint");

if (fine && wide && !save && gl2) {
  init().catch((e) => { console.error("[gr3d]", e); fail(); });
} else {
  fail();
}

function fail() {
  if (fallback) fallback.hidden = false;
  if (stage) stage.hidden = true;
  if (pinLayer) pinLayer.hidden = true;
  if (panel) panel.hidden = true;
  if (hint) hint.hidden = true;
}

async function init() {
  const THREE = await import("./three.module.js");
  const { OrbitControls } = await import("./OrbitControls.js");
  const { RoomEnvironment } = await import("./RoomEnvironment.js");

  const FINISHES = [
    { name: "Gold",      type: "metal",   color: 0xc9a24a, rough: 0.16 },
    { name: "Rose gold", type: "metal",   color: 0xd9a58f, rough: 0.18 },
    { name: "Platinum",  type: "metal",   color: 0xdfe3e8, rough: 0.12 },
    { name: "Obsidian",  type: "metal",   color: 0x15171d, rough: 0.22 },
    { name: "Diamond",   type: "crystal", color: 0xf6f7ff, ior: 2.42 },
    { name: "Emerald",   type: "crystal", color: 0x2f9f66, ior: 2.0 },
    { name: "Sapphire",  type: "crystal", color: 0x2f5fd6, ior: 2.1 },
    { name: "Ruby",      type: "crystal", color: 0xc62a4c, ior: 2.1 },
    { name: "Amethyst",  type: "crystal", color: 0x8a52d6, ior: 2.0 },
  ];
  const mkMat = (f) => f.type === "metal"
    ? new THREE.MeshStandardMaterial({ color: f.color, metalness: 1, roughness: f.rough ?? 0.18, flatShading: true, envMapIntensity: 1.25 })
    : new THREE.MeshPhysicalMaterial({ color: f.color, metalness: 0, roughness: 0.02, transmission: 1, ior: f.ior ?? 2.2, thickness: 1.5, flatShading: true, envMapIntensity: 1.6, specularIntensity: 1, transparent: true });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.18, 4.9);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 2); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe6b0, 1.1); rim.position.set(-4, 1, -3); scene.add(rim);

  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 0), mkMat(FINISHES[0]));
  gem.position.y = 0.18;  // lift clear of the finish panel in a short (iframe) viewport
  scene.add(gem);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
  controls.minDistance = 3.2; controls.maxDistance = 8; controls.target.set(0, 0.18, 0);

  const PINS = [
    { pos: new THREE.Vector3(0.62, 0.55, 0.70), text: "Drag to spin" },
    { pos: new THREE.Vector3(-0.78, 0.08, 0.55), text: "Live material swap" },
    { pos: new THREE.Vector3(0.10, -0.64, 0.72), text: "Zoom in to inspect" },
  ].map((p) => {
    p.pos.normalize().multiplyScalar(1.18);
    const el = document.createElement("div"); el.className = "pin";
    el.innerHTML = '<div class="dot"></div><div class="tag"></div>';
    el.querySelector(".tag").textContent = p.text;
    pinLayer.appendChild(el); p.el = el; return p;
  });
  let showPins = true;

  let autoSpin = !reduce;
  const spinBtn = $("spin"), labelBtn = $("labels"), resetBtn = $("reset"), sw = $("swatches");
  if (spinBtn) { spinBtn.setAttribute("aria-pressed", String(autoSpin)); spinBtn.onclick = () => { autoSpin = !autoSpin; spinBtn.setAttribute("aria-pressed", String(autoSpin)); }; }
  if (labelBtn) { labelBtn.onclick = () => { showPins = !showPins; labelBtn.setAttribute("aria-pressed", String(showPins)); if (!showPins) PINS.forEach((p) => { p.el.style.opacity = 0; }); }; }
  if (resetBtn) { resetBtn.onclick = () => { camera.position.set(0, 0.18, 4.9); controls.target.set(0, 0.18, 0); controls.update(); }; }
  if (sw) {
    FINISHES.forEach((f, i) => {
      const b = document.createElement("button");
      b.className = "sw"; b.type = "button"; b.setAttribute("aria-pressed", String(i === 0));
      b.innerHTML = '<span class="chip"></span><span class="nm"></span>';
      b.querySelector(".chip").style.background = "#" + f.color.toString(16).padStart(6, "0");
      b.querySelector(".nm").textContent = f.name;
      b.onclick = () => {
        gem.material.dispose(); gem.material = mkMat(f);
        Array.from(sw.children).forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
      };
      sw.appendChild(b);
    });
  }

  if (hint) setTimeout(() => { hint.style.opacity = 0; }, 4200);

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  }, { passive: true });

  const clock = new THREE.Clock();
  const ndc = new THREE.Vector3();
  (function loop() {
    requestAnimationFrame(loop);
    const dt = clock.getDelta();
    if (autoSpin) gem.rotation.y += dt * 0.35;
    controls.update();
    renderer.render(scene, camera);
    if (showPins) project();
  })();

  function project() {
    const w = innerWidth, h = innerHeight, camPos = camera.position;
    for (const p of PINS) {
      const dir = p.pos.clone().applyQuaternion(gem.quaternion);
      const world = dir.clone().add(gem.position);
      ndc.copy(world).project(camera);
      const facing = dir.clone().normalize().dot(camPos.clone().sub(world).normalize());
      const on = ndc.z < 1 && facing > 0.08;
      p.el.style.opacity = on ? 1 : 0;
      if (on) { p.el.style.left = ((ndc.x * 0.5 + 0.5) * w) + "px"; p.el.style.top = ((-ndc.y * 0.5 + 0.5) * h) + "px"; }
    }
  }
}

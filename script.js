// Import Three.js core + OrbitControls via esm.sh
import * as THREE from "https://esm.sh/three@0.161.0";
import { OrbitControls } from "https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js";

// Ensure canvas exists or create it
let canvas = document.querySelector('#bg');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'bg';
  document.body.appendChild(canvas);
}

// --- Scene Setup ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.4,
  1000
);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// --- Stars ---
const STAR_COUNT = 20000;
const starPositions = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3); // per-star color
for (let i = 0; i < STAR_COUNT; i++) {
  const i3 = i * 3;
  starPositions[i3 + 0] = (Math.random() - 0.5) * 400;
  starPositions[i3 + 1] = (Math.random() - 0.5) * 400;
  starPositions[i3 + 2] = (Math.random() - 0.5) * 400;

  // Start all white
  starColors[i3 + 0] = 1.0;
  starColors[i3 + 1] = 1.0;
  starColors[i3 + 2] = 1.0;
}

const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starTexture = new THREE.TextureLoader().load("star.png");
const starsMaterial = new THREE.PointsMaterial({
  map: starTexture,
  transparent: true,
  size: 12,
  depthWrite: false,
  vertexColors: true, // allow per-star color
});

const starsPoints = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starsPoints);

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Twinkling Control ---
let twinklingStars = new Set();
const starPhases = new Map();

function pickRandomStars() {
  twinklingStars.clear();
  starPhases.clear();
  while (twinklingStars.size < 5000) {
    const starIndex = Math.floor(Math.random() * STAR_COUNT);
    twinklingStars.add(starIndex);
    starPhases.set(starIndex, Math.random() * Math.PI * 2); // random phase
  }
}
pickRandomStars();

// Refresh twinkling stars every 2 seconds
setInterval(pickRandomStars, 2000);

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  const t = Date.now() * 0.002;
  const colors = starsGeometry.attributes.color.array;

  // Update only the twinkling stars
  twinklingStars.forEach(i => {
    const i3 = i * 3;
    const phase = starPhases.get(i) || 0;
    const intensity = 1.6 + Math.sin(t + phase) * 0.4; // random twinkle
    colors[i3 + 0] = intensity;
    colors[i3 + 1] = intensity;
    colors[i3 + 2] = intensity;
  });

  starsGeometry.attributes.color.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Resize Handler ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

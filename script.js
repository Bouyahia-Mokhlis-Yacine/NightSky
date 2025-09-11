// Import Three.js core + OrbitControls via esm.sh
import * as THREE from "https://esm.sh/three@0.161.0";
import { OrbitControls } from "https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js";

// Ensure canvas exists or create it
let canvas = document.querySelector("#bg");
if (!canvas) {
  canvas = document.createElement("canvas");
  canvas.id = "bg";
  document.body.appendChild(canvas);
}

// --- Scene Setup ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.4,
  5000
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

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;
controls.enableKeys = true;
controls.enableTouch = true;
controls.enableScroll = true;

// --- Moon ---
const moonGeometry = new THREE.SphereGeometry(10, 64, 64);

const moonTexture = new THREE.TextureLoader().load("moon.jpeg");
const moonNormal = new THREE.TextureLoader().load("moon_normal.jpeg");

const moonMaterial = new THREE.MeshStandardMaterial({
  map: moonTexture,
  normalMap: moonNormal,
  roughness: 1, // makes it less shiny
  metalness: 0, // no metallic reflection
  color: 0xffffff, // can tint/darken (e.g. 0xaaaaaa for dimmer look)
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moon);

moon.position.set(0, 0, 0);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(30, 30, 30); // direction of sunlight
scene.add(light);

// Optional ambient light so the dark side isn’t pitch black
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

// --- Stars ---
const STAR_COUNT = 2000;
const starPositions = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT; i++) {
  const i3 = i * 3;
  starPositions[i3 + 0] = (Math.random() - 0.5) * 2000; // x
  starPositions[i3 + 1] = (Math.random() - 0.5) * 2000; // y
  starPositions[i3 + 2] = (Math.random() - 0.5) * 2000; // z
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(starPositions, 3)
);
const starTexture = new THREE.TextureLoader().load("star.png");

const starMaterial = new THREE.PointsMaterial({
  map: starTexture,
  transparent: true,
  size: 10, // size of stars
  depthWrite: false,
});

const stars = new THREE.Points(starGeometry, starMaterial);

scene.add(stars);

// --- Clickable Stars ---
const CLICKABLE_STARS_COUNT = 100;
const clickableStarPositions = new Float32Array(CLICKABLE_STARS_COUNT * 3);
// Add per-star colors
const colors = new Float32Array(CLICKABLE_STARS_COUNT * 3);

for (let i = 0; i < CLICKABLE_STARS_COUNT; i++) {
  const i3 = i * 3;
  clickableStarPositions[i3 + 0] = (Math.random() - 0.5) * 2000; // x
  clickableStarPositions[i3 + 1] = (Math.random() - 0.5) * 2000; // y
  clickableStarPositions[i3 + 2] = (Math.random() - 0.5) * 2000; // z

  colors[i3 + 0] = 1; // R
  colors[i3 + 1] = 1; // G
  colors[i3 + 2] = 1; // B
}

// Geometry with position + color attributes
const clickableStarGeometry = new THREE.BufferGeometry();
clickableStarGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(clickableStarPositions, 3)
);
clickableStarGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(colors, 3)
);

// Material that uses per-vertex colors
const clickableStarTexture = new THREE.TextureLoader().load("star.png");
const clickableStarMaterial = new THREE.PointsMaterial({
  map: clickableStarTexture,
  transparent: true,
  size: 100,
  depthWrite: false,
  vertexColors: true, // ✅ important!
});

const clickableStars = new THREE.Points(
  clickableStarGeometry,
  clickableStarMaterial
);
scene.add(clickableStars);

// --- Raycating ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Intersect with clickable stars
  const intersects = raycaster.intersectObject(clickableStars);

  if (intersects.length > 0) {
    // Example: make it red
    const index = intersects[0].index; // which star was clicked
    highlightStar(index);
    // Show message
    messageBox.innerText = `✨ You clicked star #${index}!`;
    messageBox.style.display = "block";

    // Auto-hide after 3s
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 3000);
  }
}

// Store target colors for smooth transition
const targetColors = new Float32Array(colors.length);
targetColors.set(colors); // initially same as white

function highlightStar(index) {
  targetColors[index * 3] = 1; // target R
  targetColors[index * 3 + 1] = 0; // target G
  targetColors[index * 3 + 2] = 0; // target B
}

raycaster.params.Points.threshold = 50; // adjust for easier clicking

window.addEventListener("click", onMouseClick);

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  moon.rotation.y += 0.005;
  // Smoothly blend current colors → targetColors
  for (let i = 0; i < colors.length; i++) {
    colors[i] += (targetColors[i] - colors[i]) * 0.05; // 0.05 = speed
  }
  clickableStarGeometry.attributes.color.needsUpdate = true;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Resize Handler ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Add message box ---
const messageBox = document.createElement("div");
messageBox.style.position = "absolute";
messageBox.style.top = "20px";
messageBox.style.left = "50%";
messageBox.style.transform = "translateX(-50%)";
messageBox.style.padding = "10px 20px";
messageBox.style.background = "rgba(0,0,0,0.7)";
messageBox.style.color = "white";
messageBox.style.fontFamily = "Arial, sans-serif";
messageBox.style.fontSize = "16px";
messageBox.style.borderRadius = "8px";
messageBox.style.display = "none"; // hidden by default
document.body.appendChild(messageBox);

// --- Update on click ---
// function onMouseClick(event) {
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);

//   const intersects = raycaster.intersectObject(clickableStars);

//   if (intersects.length > 0) {
//     const index = intersects[0].index;
//     highlightStar(index);

//     // Show message
//     messageBox.innerText = `✨ You clicked star #${index}!`;
//     messageBox.style.display = "block";

//     // Auto-hide after 3s
//     setTimeout(() => {
//       messageBox.style.display = "none";
//     }, 3000);
//   }
// }

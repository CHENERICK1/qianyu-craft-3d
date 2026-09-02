import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createQianyuModel } from './createQianyuModel';
import { createAirportScene } from './createAirportScene';
import { createUFOEnhancedEffects } from './createUFOFlightEffects';

// ================= 1. 场景、相机与渲染器初始化 =================
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#030712');
scene.fog = new THREE.FogExp2('#030712', 0.0018);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 3000);
// 机位：仰角仰望夜空掠影中的乾舆神机
camera.position.set(0, 15, 140);

// ================= 2. 交互视轨控制器 (OrbitControls) =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.495; // 允许极低视角仰望夜空
controls.minDistance = 5;
controls.maxDistance = 1200;
controls.target.set(0, 30, -30);
controls.update();

// ================= 3. 高动态光照系统 =================
const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
scene.add(ambientLight);

// 主月光 (幽蓝清冷夜空天光)
const moonlight = new THREE.DirectionalLight('#93c5fd', 2.8);
moonlight.position.set(60, 140, 80);
moonlight.castShadow = true;
scene.add(moonlight);

// 地面暖色泛光 (来自远景航站楼与跑道)
const groundWarmGlow = new THREE.DirectionalLight('#f59e0b', 1.6);
groundWarmGlow.position.set(0, -10, 0);
scene.add(groundWarmGlow);

// 侧向紫蓝天光
const skyRimLight = new THREE.DirectionalLight('#818cf8', 1.2);
skyRimLight.position.set(-90, 70, -90);
scene.add(skyRimLight);

// ================= 4. 构建场景元素 =================
// 4.1 乾舆空天神机 3D 模型 (本身即是横贯夜空的发光流光神机)
const qianyu = createQianyuModel();
qianyu.root.position.set(0, 35, -30);
qianyu.root.rotation.set(0.12, -0.38, 0.18);
qianyu.root.scale.set(1.2, 1.2, 1.2);
scene.add(qianyu.root);

// 4.2 杭州萧山国际机场真实地景 (已消除近景大色块，置于远景地平线)
const airport = createAirportScene();
scene.add(airport);

// 4.3 萧山夜空积雨云层与大气光影
const ufoEffects = createUFOEnhancedEffects(qianyu.root);
scene.add(ufoEffects.group);

// 4.4 展台模式辅助底标网格
const gridHelper = new THREE.GridHelper(80, 40, '#d4af37', '#1f2937');
gridHelper.position.y = -4.99;
gridHelper.visible = false;
scene.add(gridHelper);

// ================= 5. 交互状态与场景切换 =================
let currentSceneMode: 'airport' | 'exhibition' = 'airport';
let isBlueprintMode = false;
let isLandingGearRetracted = true;
let isExploded = false;

qianyu.setLandingGearProgress(1.0);

function updateSceneUI(mode: 'airport' | 'exhibition') {
  currentSceneMode = mode;
  const tag = document.getElementById('timestamp-tag');
  const title = document.getElementById('scene-title');
  const sub = document.getElementById('scene-subtitle');

  if (mode === 'airport') {
    airport.visible = true;
    ufoEffects.group.visible = true;
    gridHelper.visible = false;
    scene.fog = new THREE.FogExp2('#030712', 0.0018);
    scene.background = new THREE.Color('#030712');
    if (tag) tag.style.display = 'block';
    if (title) title.innerText = '2010 萧山机场 UFO 还原现场';
    if (sub) sub.innerText = '杭州萧山国际机场空中目击事件 · 乾舆神机夜空掠影模拟';

    camera.position.set(0, 15, 140);
    controls.target.set(0, 30, -30);
    qianyu.root.position.set(0, 35, -30);
    qianyu.root.rotation.set(0.12, -0.38, 0.18);
    qianyu.root.scale.set(1.2, 1.2, 1.2);
    qianyu.setLandingGearProgress(1.0);
  } else {
    airport.visible = false;
    ufoEffects.group.visible = false;
    gridHelper.visible = true;
    scene.fog = null as any;
    scene.background = new THREE.Color('#0d1117');
    if (tag) tag.style.display = 'none';
    if (title) title.innerText = '乾舆一号 · 空天神机营造展台';
    if (sub) sub.innerText = '永乐天工秘录 · 混元乾坤飞舆三维营构图谱';

    camera.position.set(28, 14, 32);
    controls.target.set(0, 0, 0);
    qianyu.root.position.set(0, 0, 0);
    qianyu.root.rotation.set(0, 0, 0);
    qianyu.root.scale.set(1, 1, 1);
    qianyu.setLandingGearProgress(0.0);
  }
  controls.update();
}

// 绑定 DOM 按钮交互事件
const btnSceneToggle = document.getElementById('btn-scene-toggle');
const btnRenderMode = document.getElementById('btn-render-mode');
const btnLandingGear = document.getElementById('btn-landing-gear');
const btnExplode = document.getElementById('btn-explode');
const btnResetView = document.getElementById('btn-reset-view');

if (btnSceneToggle) {
  btnSceneToggle.addEventListener('click', () => {
    updateSceneUI(currentSceneMode === 'airport' ? 'exhibition' : 'airport');
  });
}

if (btnRenderMode) {
  btnRenderMode.addEventListener('click', () => {
    isBlueprintMode = !isBlueprintMode;
    qianyu.setRenderMode(isBlueprintMode ? 'blueprint' : 'bronze');
    btnRenderMode.classList.toggle('active', isBlueprintMode);
  });
}

if (btnLandingGear) {
  btnLandingGear.addEventListener('click', () => {
    isLandingGearRetracted = !isLandingGearRetracted;
    qianyu.setLandingGearProgress(isLandingGearRetracted ? 1.0 : 0.0);
    btnLandingGear.classList.toggle('active', isLandingGearRetracted);
  });
}

if (btnExplode) {
  btnExplode.addEventListener('click', () => {
    isExploded = !isExploded;
    qianyu.parts.forEach((p) => {
      const target = isExploded
        ? p.originPos.clone().add(p.explodeDir.clone().multiplyScalar(6))
        : p.originPos;
      p.mesh.position.copy(target);
    });
    btnExplode.classList.toggle('active', isExploded);
  });
}

if (btnResetView) {
  btnResetView.addEventListener('click', () => {
    updateSceneUI(currentSceneMode);
  });
}

// ================= 6. 窗口自适应与动画渲染循环 =================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  controls.update();
  ufoEffects.update(time);

  if (currentSceneMode === 'airport') {
    qianyu.root.position.y = 35 + Math.sin(time * 1.5) * 1.5;
    qianyu.root.rotation.y = -0.38 + Math.sin(time * 0.8) * 0.04;
  } else {
    qianyu.root.rotation.y += 0.004;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

updateSceneUI('airport');
animate();

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createQianyuModel } from './createQianyuModel';
import { createAirportScene } from './createAirportScene';
import { createUFOFlightEffects } from './createUFOFlightEffects';

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
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080b10');
scene.fog = new THREE.FogExp2('#080b10', 0.003);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 2000);
camera.position.set(0, 15, 120);

// ================= 2. 交互视轨控制器 (OrbitControls) =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.49; // 防止穿透地表
controls.minDistance = 5;
controls.maxDistance = 800;
controls.target.set(0, 30, -50);
controls.update();

// ================= 3. 光照系统 =================
const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
scene.add(ambientLight);

// 主聚光灯 (前上方金暖色)
const mainLight = new THREE.DirectionalLight('#fff2d6', 2.5);
mainLight.position.set(40, 80, 50);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

// 侧向幽蓝夜空轮廓光
const rimLight = new THREE.DirectionalLight('#38bdf8', 2.0);
rimLight.position.set(-60, 40, -60);
scene.add(rimLight);

// 萧山地表暖色泛光
const groundGlow = new THREE.DirectionalLight('#f59e0b', 1.0);
groundGlow.position.set(0, -10, 0);
scene.add(groundGlow);

// ================= 4. 构建场景元素 =================
// 4.1 乾舆空天神机 3D 模型
const qianyu = createQianyuModel();
qianyu.root.position.set(0, 45, -60);
qianyu.root.rotation.set(0.15, -0.4, 0.2); // 萧山掠影俯冲飞行动态
scene.add(qianyu.root);

// 4.2 杭州萧山国际机场地景 (航站楼、塔台、跑道)
const airport = createAirportScene();
scene.add(airport);

// 4.3 萧山夜空长曝光光轨与频闪脉冲特效
const ufoEffects = createUFOFlightEffects();
scene.add(ufoEffects.group);

// 4.4 展台模式辅助底标网格
const gridHelper = new THREE.GridHelper(60, 40, '#d4af37', '#1f2937');
gridHelper.position.y = -3.49;
gridHelper.visible = false;
scene.add(gridHelper);

// ================= 5. 交互状态与场景切换 =================
let currentSceneMode: 'airport' | 'exhibition' = 'airport';
let isBlueprintMode = false;
let isLandingGearRetracted = true; // 飞行场景下默认收起起落架
let isExploded = false;

// 初始化收折起落架 (1.0 = 完全收起)
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
    scene.fog = new THREE.FogExp2('#080b10', 0.003);
    scene.background = new THREE.Color('#080b10');
    if (tag) tag.style.display = 'block';
    if (title) title.innerText = '2010 萧山机场 UFO 还原现场';
    if (sub) sub.innerText = '杭州萧山国际机场空中目击事件 · 乾舆神机夜空掠影模拟';

    // 相机转为机场仰视机位
    camera.position.set(0, 15, 120);
    controls.target.set(0, 30, -50);
    qianyu.root.position.set(0, 45, -60);
    qianyu.root.rotation.set(0.15, -0.4, 0.2);
    qianyu.root.scale.set(1.4, 1.4, 1.4);
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

    // 相机转为展台近景特写机位
    camera.position.set(18, 10, 22);
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
        ? p.originPos.clone().add(p.explodeDir.clone().multiplyScalar(4))
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

  // 更新视轨阻尼
  controls.update();

  // 更新夜空光轨与频闪动画
  ufoEffects.update(time);

  // 乾舆神机自主微动浮游
  if (currentSceneMode === 'airport') {
    qianyu.root.position.y = 45 + Math.sin(time * 1.5) * 1.2;
    qianyu.root.rotation.y = -0.4 + Math.sin(time * 0.8) * 0.05;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

// 启动渲染
updateSceneUI('airport');
animate();

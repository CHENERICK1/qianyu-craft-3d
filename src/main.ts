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
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070a');
scene.fog = new THREE.FogExp2('#05070a', 0.0025);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 2500);
camera.position.set(0, 18, 140);

// ================= 2. 交互视轨控制器 (OrbitControls) =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.495; // 允许极低视角仰望，防止穿透地表
controls.minDistance = 3;
controls.maxDistance = 1000;
controls.target.set(0, 35, -50);
controls.update();

// ================= 3. 高动态光照系统 (PBR + 电影感冷暖光影) =================
const ambientLight = new THREE.AmbientLight('#ffffff', 0.65);
scene.add(ambientLight);

// 主月光/高空逆光 (幽蓝清冷，照射云层与机翼)
const moonlight = new THREE.DirectionalLight('#93c5fd', 2.8);
moonlight.position.set(50, 100, 60);
moonlight.castShadow = true;
moonlight.shadow.mapSize.width = 2048;
moonlight.shadow.mapSize.height = 2048;
scene.add(moonlight);

// 萧山地表大范围暖色漫反射光 (来自航站楼 320m 幕墙与跑道)
const groundWarmGlow = new THREE.DirectionalLight('#f59e0b', 1.8);
groundWarmGlow.position.set(0, -10, 0);
scene.add(groundWarmGlow);

// 侧向紫蓝高空天光 (增加夜空丰富度)
const skyRimLight = new THREE.DirectionalLight('#c084fc', 1.2);
skyRimLight.position.set(-80, 50, -80);
scene.add(skyRimLight);

// ================= 4. 构建场景元素 =================
// 4.1 乾舆空天神机 3D 模型
const qianyu = createQianyuModel();
qianyu.root.position.set(0, 50, -60);
qianyu.root.rotation.set(0.18, -0.45, 0.22); // 萧山掠影侧倾俯冲动态
scene.add(qianyu.root);

// 4.2 杭州萧山国际机场地景 (现代化 320m 暖光航站楼、72m 塔台、跑道灯光系统)
const airport = createAirportScene();
scene.add(airport);

// 4.3 萧山夜空长曝光弧形光轨、24 宿飞碟外缘光斑与积雨云层
const ufoEffects = createUFOEnhancedEffects(qianyu.root);
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
    scene.fog = new THREE.FogExp2('#05070a', 0.0025);
    scene.background = new THREE.Color('#05070a');
    if (tag) tag.style.display = 'block';
    if (title) title.innerText = '2010 萧山机场 UFO 还原现场';
    if (sub) sub.innerText = '杭州萧山国际机场空中目击事件 · 乾舆神机夜空掠影模拟';

    // 相机转为萧山机场全景仰望机位
    camera.position.set(0, 18, 140);
    controls.target.set(0, 35, -50);
    qianyu.root.position.set(0, 50, -60);
    qianyu.root.rotation.set(0.18, -0.45, 0.22);
    qianyu.root.scale.set(1.5, 1.5, 1.5);
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

  // 更新夜空光轨、24 宿飞碟光斑脉冲与云层动画
  ufoEffects.update(time);

  // 乾舆神机自主微动浮游
  if (currentSceneMode === 'airport') {
    qianyu.root.position.y = 50 + Math.sin(time * 1.6) * 1.5;
    qianyu.root.rotation.y = -0.45 + Math.sin(time * 0.9) * 0.06;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

// 启动渲染
updateSceneUI('airport');
animate();

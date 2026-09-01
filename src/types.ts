import * as THREE from 'three';

export interface ExplodablePart {
  mesh: THREE.Object3D;
  originPos: THREE.Vector3;
  explodeDir: THREE.Vector3;
  name: string;
  desc: string;
}

export interface QianyuModelResult {
  root: THREE.Group;
  parts: ExplodablePart[];
  landingGearGroup: THREE.Group;
  updateAnimation: (delta: number) => void;
  setLandingGearProgress: (progress: number) => void; // 0 = 展开着陆, 1 = 完全收折飞行
  setRenderMode: (mode: 'bronze' | 'blueprint') => void;
}

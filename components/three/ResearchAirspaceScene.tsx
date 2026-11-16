'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type ResearchAirspaceSceneProps = {
  lowQuality: boolean;
  reducedMotion: boolean;
  /** 每帧回调，只写 window 探针；离屏 frameloop=never 时自动停止 */
  onFrame: () => void;
};

declare global {
  interface Window {
    /** 悬停扇区探针：-1 表示未悬停（pointer 事件写入，不进每帧） */
    __researchHoverSector?: number;
  }
}

const SECTOR_COUNT = 4;
const RIM_RADIUS = 2.05;
/** 每个扇区闭环 5 点：hub → 3 个 rim 点 → hub */
const POINTS_PER_SECTOR = 5;

/** 卸载时显式释放 GPU 资源（与 US-006e / US-008d / US-018f 同一模式） */
function DisposeOnUnmount() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(
    () => () => {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          if (!material) continue;
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          material.dispose();
        }
      });
      gl.dispose();
    },
    [scene, gl],
  );
  return null;
}

/**
 * US-010f：空域概念示意场景。
 * - 空间网格 + 4 个动态扇区（边界随时间漂移/形变，示意动态扇区化）
 * - 2 条飞行轨迹 + 3 个流动标记（示意交通流）
 * - 悬停扇区高亮（AC3「能正常加载和交互」），状态只进 ref / window 探针
 *
 * 性能红线（US-006 TBT 教训）：useFrame 内不读布局、不写 dataset、不 setState。
 * 概念性示意：DOM 侧已有「非真实仿真数据」标注（PRD 红线）。
 */
export default function ResearchAirspaceScene({
  lowQuality,
  reducedMotion,
  onFrame,
}: ResearchAirspaceSceneProps) {
  const group = useRef<THREE.Group>(null);
  const hovered = useRef<number>(-1);

  // 扇区闭环线：Float32Array 每帧只改少量顶点并置 needsUpdate
  const sectorLines = useMemo(() => {
    const colors = ['#7c6cff', '#22d3ee', '#7c6cff', '#22d3ee'];
    return Array.from({ length: SECTOR_COUNT }, (_, index) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(POINTS_PER_SECTOR * 3), 3),
      );
      const material = new THREE.LineBasicMaterial({
        color: colors[index % colors.length],
        transparent: true,
        opacity: 0.45,
      });
      return { line: new THREE.Line(geometry, material), material };
    });
  }, []);

  // 悬停命中垫：4 个扇形薄片（不可见透明，仅供 raycast）
  const hoverPads = useMemo(
    () =>
      Array.from({ length: SECTOR_COUNT }, (_, index) => ({
        thetaStart: (index / SECTOR_COUNT) * Math.PI * 2,
        thetaLength: Math.PI * 2 / SECTOR_COUNT,
      })),
    [],
  );

  // 飞行轨迹曲线（构型一次；标记逐帧取点）
  const trajectories = useMemo(() => {
    const make = (points: [number, number, number][]) =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return [
      make([
        [-2.6, 0.35, -1.5],
        [-0.9, 0.85, 0.1],
        [1.1, 0.55, 0.9],
        [2.5, 1.05, 1.7],
      ]),
      make([
        [2.3, 0.55, -1.9],
        [0.7, 1.05, -0.3],
        [-1.3, 0.65, 0.8],
        [-2.7, 1.15, 1.9],
      ]),
    ];
  }, []);

  const trajectoryLines = useMemo(
    () =>
      trajectories.map((curve) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
        const material = new THREE.LineBasicMaterial({
          color: '#22d3ee',
          transparent: true,
          opacity: 0.3,
        });
        return new THREE.Line(geometry, material);
      }),
    [trajectories],
  );

  const markers = useMemo(
    () =>
      [0, 1, 2].map((index) => ({
        mesh: new THREE.Mesh(
          new THREE.SphereGeometry(0.075, lowQuality ? 8 : 12, lowQuality ? 8 : 12),
          new THREE.MeshStandardMaterial({
            color: '#14112b',
            emissive: index % 2 === 0 ? '#22d3ee' : '#7c6cff',
            emissiveIntensity: 0.85,
          }),
        ),
        phase: index / 3,
        curve: trajectories[index % trajectories.length],
      })),
    [lowQuality, trajectories],
  );

  useEffect(() => {
    window.__researchHoverSector = -1;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;

    if (!reducedMotion && group.current) {
      group.current.rotation.y = t * 0.035;
    }

    // 动态扇区：边界角缓慢漂移 + 半径呼吸 + hub 轻微偏移（形变动画）
    const drift = reducedMotion ? 0 : t * 0.05;
    for (let i = 0; i < SECTOR_COUNT; i += 1) {
      const { line, material } = sectorLines[i];
      const position = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const array = position.array as Float32Array;
      const a0 = (i / SECTOR_COUNT) * Math.PI * 2 + drift;
      const a1 = ((i + 1) / SECTOR_COUNT) * Math.PI * 2 + drift;
      const hubX = reducedMotion ? 0 : Math.sin(t * 0.6 + i) * 0.12;
      const hubZ = reducedMotion ? 0 : Math.cos(t * 0.5 + i * 1.3) * 0.12;
      const wobble = reducedMotion ? 0 : Math.sin(t * 0.8 + i * 0.9) * 0.09;
      const rim = RIM_RADIUS + wobble;

      // hub
      array[0] = hubX;
      array[1] = 0.02;
      array[2] = hubZ;
      // 三个 rim 点（扇区中点更细）
      for (let k = 0; k < 3; k += 1) {
        const angle = a0 + ((a1 - a0) * (k + 1)) / 4;
        array[3 + k * 3] = Math.cos(angle) * rim;
        array[4 + k * 3] = 0.02;
        array[5 + k * 3] = Math.sin(angle) * rim;
      }
      // 闭环回 hub
      array[12] = hubX;
      array[13] = 0.02;
      array[14] = hubZ;
      position.needsUpdate = true;

      // 悬停高亮：opacity 插值，不 setState
      const target = hovered.current === i ? 0.92 : 0.45;
      material.opacity += (target - material.opacity) * Math.min(1, dt * 8);
    }

    // 轨迹标记流动
    if (!reducedMotion) {
      for (const marker of markers) {
        const u = (t * 0.055 + marker.phase) % 1;
        marker.mesh.position.copy(marker.curve.getPointAt(u));
      }
    }

    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.55} />
      <pointLight position={[2.5, 3.2, 2.5]} intensity={12} color="#7c6cff" />
      <pointLight position={[-2.6, -1.6, 2]} intensity={7} color="#22d3ee" />

      <group ref={group}>
        {/* 空间网格 */}
        <gridHelper args={[8, 12, '#3b3f66', '#232747']} position={[0, -0.02, 0]} />

        {/* 扇区边界线 */}
        {sectorLines.map(({ line }, index) => (
          <primitive key={`sector-line-${index}`} object={line} />
        ))}

        {/* 悬停命中垫（近乎不可见） */}
        {hoverPads.map((pad, index) => (
          <mesh
            key={`pad-${index}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.005, 0]}
            onPointerOver={(event) => {
              event.stopPropagation();
              hovered.current = index;
              window.__researchHoverSector = index;
            }}
            onPointerOut={() => {
              hovered.current = -1;
              window.__researchHoverSector = -1;
            }}
          >
            <circleGeometry args={[RIM_RADIUS, 24, pad.thetaStart, pad.thetaLength]} />
            <meshBasicMaterial
              color="#7c6cff"
              transparent
              opacity={0.02}
              depthWrite={false}
            />
          </mesh>
        ))}

        {/* 飞行轨迹与流动标记 */}
        {trajectoryLines.map((line, index) => (
          <primitive key={`trajectory-${index}`} object={line} />
        ))}
        {markers.map((marker, index) => (
          <primitive key={`marker-${index}`} object={marker.mesh} />
        ))}
      </group>
    </>
  );
}

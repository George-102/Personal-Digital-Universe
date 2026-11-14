'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type JourneyOrbitSceneProps = {
  count: number;
  /** DOM 卡片 hover/focus 的条目下标；null 表示无高亮 */
  activeIndex: number | null;
  lowQuality: boolean;
  reducedMotion: boolean;
  /** 每帧回调，供 DOM 层统计帧数（视口外 frameloop=never 时自动停止） */
  onFrame: () => void;
};

/** 卸载时显式释放 GPU 资源（与 US-006d 同一模式） */
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
 * US-008d：低面数空间轨道。节点沿曲线从新到旧排布，只做视觉参照；
 * 文字信息完全在 DOM 时间轴里，这里 aria-hidden 且不放可读文本。
 */
export default function JourneyOrbitScene({
  count,
  activeIndex,
  lowQuality,
  reducedMotion,
  onFrame,
}: JourneyOrbitSceneProps) {
  const group = useRef<THREE.Group>(null);
  const nodes = useRef<Array<THREE.Mesh | null>>([]);
  const scaleTarget = useRef(new THREE.Vector3());

  const { curve, points } = useMemo(() => {
    const total = Math.max(count, 2);
    const raw = Array.from({ length: total }, (_, index) => {
      const t = index / (total - 1);
      const y = 2.5 - t * 5;
      const angle = t * Math.PI * 1.35;
      const radius = 0.5 + Math.sin(t * Math.PI) * 0.32;
      return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    });
    return { curve: new THREE.CatmullRomCurve3(raw), points: raw };
  }, [count]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (!reducedMotion && group.current) {
      group.current.rotation.y += dt * 0.06;
    }
    // 只改 scale / emissive 强度，不读布局、不 setState
    nodes.current.forEach((mesh, index) => {
      if (!mesh) return;
      const target = index === activeIndex ? 1.85 : 1;
      scaleTarget.current.setScalar(target);
      mesh.scale.lerp(scaleTarget.current, reducedMotion ? 1 : 0.18);
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material) {
        const glow = index === activeIndex ? 1.9 : 0.55;
        material.emissiveIntensity += (glow - material.emissiveIntensity) * 0.18;
      }
    });
    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.55} />
      <pointLight position={[2.5, 3, 3]} intensity={16} color="#7c6cff" />
      <pointLight position={[-2.5, -2, 2]} intensity={9} color="#22d3ee" />

      <group ref={group} rotation={[0, 0.4, 0]}>
        {/* 轨道本体：低分段 tube，低画质档再降一半 */}
        <mesh>
          <tubeGeometry args={[curve, lowQuality ? 40 : 72, 0.011, 6, false]} />
          <meshBasicMaterial color="#7c6cff" transparent opacity={0.4} />
        </mesh>

        {points.map((point, index) => (
          <mesh
            key={index}
            ref={(instance) => {
              nodes.current[index] = instance;
            }}
            position={point}
          >
            <sphereGeometry args={[0.075, lowQuality ? 10 : 16, lowQuality ? 10 : 16]} />
            <meshStandardMaterial
              color="#14112b"
              emissive={index === 0 ? '#22d3ee' : '#7c6cff'}
              emissiveIntensity={0.55}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

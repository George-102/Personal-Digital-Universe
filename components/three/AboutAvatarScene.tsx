'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type AboutAvatarSceneProps = {
  lowQuality: boolean;
  reducedMotion: boolean;
  /** 每帧回调，供 DOM 层统计渲染帧数（视口外 frameloop=never 时自动停止） */
  onFrame: () => void;
};

/** 卸载时显式释放 GPU 资源（开发红线 3，与 US-001d 同一模式） */
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
 * US-006d：低面数抽象 3D 头像。无外部资源、无粒子、无后处理，
 * 与 US-001c 的 Hero 场景共用同一视觉语言（深紫核心 + 青色线框 + 轨道）。
 */
export default function AboutAvatarScene({
  lowQuality,
  reducedMotion,
  onFrame,
}: AboutAvatarSceneProps) {
  const core = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!reducedMotion) {
      const dt = Math.min(delta, 0.1);
      if (core.current) {
        core.current.rotation.y += dt * 0.14;
        core.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.06;
      }
      if (rings.current) rings.current.rotation.z -= dt * 0.06;
    }
    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 2, 4]} intensity={22} color="#7c6cff" />
      <pointLight position={[-3, -1, 3]} intensity={12} color="#22d3ee" />

      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshStandardMaterial
            color="#14112b"
            emissive="#7c6cff"
            emissiveIntensity={0.35}
            flatShading
            roughness={0.45}
            metalness={0.45}
          />
        </mesh>
        <mesh scale={1.2}>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.22} />
        </mesh>
      </group>

      <group ref={rings}>
        <mesh rotation={[Math.PI / 2.6, 0, 0]}>
          <torusGeometry args={[1.5, 0.007, 6, lowQuality ? 48 : 80]} />
          <meshBasicMaterial color="#7c6cff" transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[Math.PI / 1.8, 0.5, 0]}>
          <torusGeometry args={[1.78, 0.005, 6, lowQuality ? 48 : 80]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
        </mesh>
        {!lowQuality && (
          <>
            <mesh position={[1.5, 0.25, 0]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshBasicMaterial color="#22d3ee" />
            </mesh>
            <mesh position={[-1.2, -0.9, 0.3]}>
              <sphereGeometry args={[0.04, 10, 10]} />
              <meshBasicMaterial color="#8f9bff" />
            </mesh>
          </>
        )}
      </group>
    </>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSectionTint } from '@/lib/use-section-tint';

export type ContactOrbitSceneProps = {
  lowQuality: boolean;
  reducedMotion: boolean;
  /** 每帧回调，只写 window 探针；离屏 frameloop=never 时自动停止 */
  onFrame: () => void;
};

/** 卸载时显式释放 GPU 资源（与 US-006e / US-008d 同一模式） */
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
 * US-018f：Contact 的 3D 空间场景。低面数核心 + 线框壳 + 三条轨道 + 节点，
 * 纯视觉层（父容器 aria-hidden），全部信息在 DOM 面板里。
 * 性能红线：useFrame 内不读布局、不写 dataset、不 setState。
 */
export default function ContactOrbitScene({
  lowQuality,
  reducedMotion,
  onFrame,
}: ContactOrbitSceneProps) {
  const tint = useSectionTint();
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const segments = lowQuality ? 32 : 64;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (!reducedMotion && group.current) {
      group.current.rotation.y += dt * 0.07;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
    }
    if (!reducedMotion && core.current) core.current.rotation.x += dt * 0.1;
    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.6} />
      <pointLight position={[2.5, 3, 3]} intensity={15} color={tint.glow} />
      <pointLight position={[-2.5, -2, 2]} intensity={9} color={tint.accent} />

      <group ref={group} rotation={[0.35, 0.4, 0]}>
        <mesh ref={core}>
          <icosahedronGeometry args={[0.92, 0]} />
          <meshStandardMaterial
            color="#14112b"
            emissive="#7c6cff"
            emissiveIntensity={0.35}
            roughness={0.42}
            metalness={0.3}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.28, 0]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.24} />
        </mesh>

        {[0, 1, 2].map((index) => (
          <mesh
            key={index}
            rotation={[Math.PI / 2 + index * 0.42, index * 0.55, index * 0.24]}
          >
            <torusGeometry args={[1.7 + index * 0.24, 0.009, 4, segments]} />
            <meshBasicMaterial
              color={index === 1 ? '#22d3ee' : '#7c6cff'}
              transparent
              opacity={0.38}
            />
          </mesh>
        ))}

        {[0, 1, 2, 3, 4].map((index) => {
          const angle = (index / 5) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * 1.92, Math.sin(angle) * 0.9, Math.sin(angle) * 1.2]}>
              <sphereGeometry args={[0.065, lowQuality ? 8 : 12, lowQuality ? 8 : 12]} />
              <meshStandardMaterial
                color="#14112b"
                emissive={index % 2 === 0 ? '#22d3ee' : '#7c6cff'}
                emissiveIntensity={0.7}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

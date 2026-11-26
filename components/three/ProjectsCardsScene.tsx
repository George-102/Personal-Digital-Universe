'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSectionTint } from '@/lib/use-section-tint';

export type ProjectsCardsSceneProps = {
  count: number;
  reducedMotion: boolean;
  onFrame: () => void;
};

declare global {
  interface Window {
    /** DOM 卡片 hover/focus 写入的激活索引（ProjectsInteractions 事件委托，非每帧写） */
    __projectsActive?: number;
    /** 指针方向（NDC），document pointermove 事件驱动写入 */
    __projectsPointer?: { x: number; y: number };
    /** 3D 层读到的当前激活索引探针（E2E 断言） */
    __projectsHover?: number;
  }
}

/** 卸载时释放 GPU 资源（与 US-006e / US-008d / US-010f 同模式） */
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

const COLUMNS = 3;
const CARD_W = 1.3;
const CARD_H = 0.78;

/**
 * US-012g：3D 浮动卡片概念视觉层。
 * 卡片是 3D 平面 + 边缘线；DOM 卡片 hover/focus 写入 window.__projectsActive，
 * useFrame 只读该 ref 与指针方向做插值：倾斜、抬升、边缘高亮、光照方向表面反馈。
 * 性能红线：useFrame 内零布局读取、零 dataset 写入、零 setState。
 */
export default function ProjectsCardsScene({
  count,
  reducedMotion,
  onFrame,
}: ProjectsCardsSceneProps) {
  const tint = useSectionTint();
  const group = useRef<THREE.Group>(null);

  const cards = useMemo(() => {
    const geometry = new THREE.BoxGeometry(CARD_W, CARD_H, 0.05);
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    return Array.from({ length: count }, (_, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: '#171438',
        emissive: index % 2 === 0 ? '#6d5cff' : '#1a9fb4',
        emissiveIntensity: 0.18,
        metalness: 0.35,
        roughness: 0.5,
      });
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: index % 2 === 0 ? '#a78bfa' : '#67e8f9',
        transparent: true,
        opacity: 0.35,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      const row = Math.floor(index / COLUMNS);
      const col = index % COLUMNS;
      mesh.position.set((col - 1) * 1.55, (1 - row) * 1.02, 0);
      edges.position.copy(mesh.position);
      return { mesh, edges, material, edgeMaterial, baseY: mesh.position.y };
    });
  }, [count]);

  useEffect(() => {
    window.__projectsActive = -1;
    window.__projectsHover = -1;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const active = Math.max(-1, Math.min(count - 1, window.__projectsActive ?? -1));

    const pointer = window.__projectsPointer ?? { x: 0, y: 0 };
    for (let i = 0; i < cards.length; i += 1) {
      const { mesh, edges, material, edgeMaterial, baseY } = cards[i];
      const isActive = i === active;
      const tiltX = reducedMotion || !isActive ? 0 : pointer.y * 0.22;
      const tiltY = reducedMotion || !isActive ? 0 : pointer.x * 0.28;
      const lift = isActive && !reducedMotion ? 0.28 : 0;
      const targetEmissive = isActive ? 0.85 : 0.18;
      const targetEdge = isActive ? 0.95 : 0.35;

      mesh.rotation.x += (tiltX - mesh.rotation.x) * Math.min(1, dt * 8);
      mesh.rotation.y += (tiltY - mesh.rotation.y) * Math.min(1, dt * 8);
      mesh.position.y += (baseY + lift - mesh.position.y) * Math.min(1, dt * 8);
      edges.rotation.copy(mesh.rotation);
      edges.position.copy(mesh.position);
      material.emissiveIntensity +=
        (targetEmissive - material.emissiveIntensity) * Math.min(1, dt * 8);
      edgeMaterial.opacity += (targetEdge - edgeMaterial.opacity) * Math.min(1, dt * 8);
    }

    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.6} />
      <pointLight position={[2.4, 2.6, 3]} intensity={12} color={tint.glow} />
      <pointLight position={[-2.4, -1.8, 2]} intensity={8} color={tint.accent} />
      <group ref={group}>
        {cards.map(({ mesh, edges }, index) => (
          <group key={index}>
            <primitive object={mesh} />
            <primitive object={edges} />
          </group>
        ))}
      </group>
    </>
  );
}

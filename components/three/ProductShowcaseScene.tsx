'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSectionTint } from '@/lib/use-section-tint';

export type ProductShowcaseSceneProps = {
  count: number;
  reducedMotion: boolean;
  onFrame: () => void;
};

declare global {
  interface Window {
    /** DOM 产品卡 hover/focus 写入的激活索引（ProductsInteractions 事件委托，非每帧写） */
    __productsActive?: number;
    /** 指针方向（NDC），document pointermove 事件驱动写入 */
    __productsPointer?: { x: number; y: number };
    /** 3D 层读到的当前激活索引探针（E2E 断言） */
    __productsHover?: number;
  }
}

/** 卸载时释放 GPU 资源（与 US-006e / US-008d / US-010f / US-012g 同模式） */
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
const PODIUM_W = 1.32;
const PODIUM_H = 0.82;

/**
 * US-013f：3D 产品展台概念视觉层。
 * 每个产品 = 底座 + 悬浮产品面板 + 边缘线；DOM hover/focus 写 window.__productsActive，
 * useFrame 只读该值与指针方向做插值：透视倾斜、抬升、边缘高亮、光照方向表面反馈。
 * 性能红线：useFrame 内零布局读取、零 dataset 写入、零 setState。
 */
export default function ProductShowcaseScene({
  count,
  reducedMotion,
  onFrame,
}: ProductShowcaseSceneProps) {
  const tint = useSectionTint();
  const items = useMemo(() => {
    const panelGeometry = new THREE.BoxGeometry(PODIUM_W, PODIUM_H, 0.05);
    const baseGeometry = new THREE.CylinderGeometry(0.42, 0.5, 0.08, 20);
    const edgeGeometry = new THREE.EdgesGeometry(panelGeometry);
    return Array.from({ length: count }, (_, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: '#171438',
        emissive: index % 2 === 0 ? '#6d5cff' : '#1a9fb4',
        emissiveIntensity: 0.16,
        metalness: 0.4,
        roughness: 0.45,
      });
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: '#0f0d24',
        emissive: index % 2 === 0 ? '#4338ca' : '#0e7490',
        emissiveIntensity: 0.2,
        metalness: 0.55,
        roughness: 0.4,
      });
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: index % 2 === 0 ? '#a78bfa' : '#67e8f9',
        transparent: true,
        opacity: 0.32,
      });
      const panel = new THREE.Mesh(panelGeometry, material);
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      const row = Math.floor(index / COLUMNS);
      const col = index % COLUMNS;
      const x = (col - (COLUMNS - 1) / 2) * 1.62;
      const baseY = (1 - row) * 1.05;
      panel.position.set(x, baseY, 0.18);
      base.position.set(x, baseY - 0.52, 0);
      edges.position.copy(panel.position);
      return { panel, base, edges, material, baseMaterial, edgeMaterial, baseY };
    });
  }, [count]);

  useEffect(() => {
    window.__productsActive = -1;
    window.__productsHover = -1;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const active = Math.max(-1, Math.min(count - 1, window.__productsActive ?? -1));
    const pointer = window.__productsPointer ?? { x: 0, y: 0 };

    for (let i = 0; i < items.length; i += 1) {
      const { panel, base, edges, material, baseMaterial, edgeMaterial, baseY } = items[i];
      const isActive = i === active;
      const tiltX = reducedMotion || !isActive ? 0 : pointer.y * 0.24;
      const tiltY = reducedMotion || !isActive ? 0 : pointer.x * 0.3;
      const lift = isActive && !reducedMotion ? 0.3 : 0;
      const targetEmissive = isActive ? 0.9 : 0.16;
      const targetBaseEmissive = isActive ? 0.7 : 0.2;
      const targetEdge = isActive ? 0.98 : 0.32;

      panel.rotation.x += (tiltX - panel.rotation.x) * Math.min(1, dt * 8);
      panel.rotation.y += (tiltY - panel.rotation.y) * Math.min(1, dt * 8);
      panel.position.y += (baseY + lift - panel.position.y) * Math.min(1, dt * 8);
      edges.rotation.copy(panel.rotation);
      edges.position.copy(panel.position);
      material.emissiveIntensity +=
        (targetEmissive - material.emissiveIntensity) * Math.min(1, dt * 8);
      baseMaterial.emissiveIntensity +=
        (targetBaseEmissive - baseMaterial.emissiveIntensity) * Math.min(1, dt * 8);
      edgeMaterial.opacity += (targetEdge - edgeMaterial.opacity) * Math.min(1, dt * 8);
      base.rotation.y += reducedMotion ? 0 : dt * (isActive ? 0.8 : 0.15);
    }

    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.6} />
      <pointLight position={[2.4, 2.6, 3]} intensity={12} color={tint.glow} />
      <pointLight position={[-2.4, -1.8, 2]} intensity={8} color={tint.accent} />
      {items.map(({ panel, base, edges }, index) => (
        <group key={index}>
          <primitive object={base} />
          <primitive object={panel} />
          <primitive object={edges} />
        </group>
      ))}
    </>
  );
}

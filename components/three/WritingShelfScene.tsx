'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSectionTint } from '@/lib/use-section-tint';

export type WritingShelfSceneProps = {
  count: number;
  reducedMotion: boolean;
  onFrame: () => void;
};

declare global {
  interface Window {
    /** DOM 作品卡 hover/focus 写入的激活索引（WritingInteractions 事件委托，非每帧写） */
    __writingActive?: number;
    /** 指针方向（NDC），document pointermove 事件驱动写入 */
    __writingPointer?: { x: number; y: number };
    /** 3D 层读到的当前激活索引探针（E2E 断言） */
    __writingHover?: number;
    __writingFrames?: number;
  }
}

/** 卸载时释放 GPU 资源（与 US-013f 同模式） */
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
 * US-014f：悬浮书架概念视觉层。每部作品 = 书脊盒 + 页边，hover 抬升 / 倾斜 / 翻页幅度克制。
 * DOM hover/focus 写 window.__writingActive，useFrame 只读该值与指针方向做插值。
 * 性能红线：useFrame 内零布局读取、零 dataset 写入、零 setState。
 */
export default function WritingShelfScene({
  count,
  reducedMotion,
  onFrame,
}: WritingShelfSceneProps) {
  const tint = useSectionTint();
  const items = useMemo(() => {
    const coverGeometry = new THREE.BoxGeometry(0.62, 0.86, 0.1);
    const pageGeometry = new THREE.BoxGeometry(0.56, 0.8, 0.06);
    const edgeGeometry = new THREE.EdgesGeometry(coverGeometry);
    return Array.from({ length: count }, (_, index) => {
      const coverMaterial = new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? '#241c54' : '#123247',
        emissive: index % 2 === 0 ? '#6d5cff' : '#1a9fb4',
        emissiveIntensity: 0.14,
        metalness: 0.35,
        roughness: 0.5,
      });
      const pageMaterial = new THREE.MeshStandardMaterial({
        color: '#e8e4f5',
        emissive: '#a78bfa',
        emissiveIntensity: 0.05,
        roughness: 0.85,
      });
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: index % 2 === 0 ? '#a78bfa' : '#67e8f9',
        transparent: true,
        opacity: 0.35,
      });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      const pages = new THREE.Mesh(pageGeometry, pageMaterial);
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      const x = (index - (count - 1) / 2) * 1.06;
      const baseY = 0;
      cover.position.set(x, baseY, 0);
      pages.position.set(x, baseY, -0.02);
      edges.position.copy(cover.position);
      return { cover, pages, edges, coverMaterial, pageMaterial, edgeMaterial, baseY };
    });
  }, [count]);

  useEffect(() => {
    window.__writingActive = -1;
    window.__writingHover = -1;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const active = Math.max(-1, Math.min(count - 1, window.__writingActive ?? -1));
    const pointer = window.__writingPointer ?? { x: 0, y: 0 };
    window.__writingHover = active;

    for (let i = 0; i < items.length; i += 1) {
      const { cover, pages, edges, coverMaterial, edgeMaterial, baseY } = items[i];
      const isActive = i === active;
      const lift = isActive && !reducedMotion ? 0.32 : 0;
      const tiltY = isActive && !reducedMotion ? pointer.x * 0.34 : 0;
      const tiltZ = isActive && !reducedMotion ? -pointer.y * 0.14 : 0;
      const flip = isActive && !reducedMotion ? 0.22 : 0;
      const targetEmissive = isActive ? 0.7 : 0.14;
      const targetEdge = isActive ? 0.9 : 0.35;

      cover.position.y += (baseY + lift - cover.position.y) * Math.min(1, dt * 8);
      cover.rotation.y += (tiltY - cover.rotation.y) * Math.min(1, dt * 8);
      cover.rotation.z += (tiltZ - cover.rotation.z) * Math.min(1, dt * 8);
      pages.rotation.y += (flip - pages.rotation.y) * Math.min(1, dt * 8);
      pages.position.y = cover.position.y;
      edges.position.copy(cover.position);
      edges.rotation.copy(cover.rotation);
      coverMaterial.emissiveIntensity +=
        (targetEmissive - coverMaterial.emissiveIntensity) * Math.min(1, dt * 8);
      edgeMaterial.opacity += (targetEdge - edgeMaterial.opacity) * Math.min(1, dt * 8);
    }

    onFrame();
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.65} />
      <pointLight position={[2.2, 2.4, 3]} intensity={12} color={tint.glow} />
      <pointLight position={[-2.2, -1.6, 2]} intensity={8} color={tint.accent} />
      {items.map(({ cover, pages, edges }, index) => (
        <group key={index}>
          <primitive object={pages} />
          <primitive object={cover} />
          <primitive object={edges} />
        </group>
      ))}
    </>
  );
}

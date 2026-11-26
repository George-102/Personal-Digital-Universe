'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSectionTint } from '@/lib/use-section-tint';
import { SKILL_CATEGORIES } from '@/lib/skills';

export type SkillsStarSceneProps = {
  /** 六个领域各自的技能数，顺序与 DOM 分组一致 */
  counts: number[];
  reducedMotion: boolean;
  onFrame: () => void;
};

declare global {
  interface Window {
    /** DOM 技能卡 hover/focus 写入的激活索引（SkillsInteractions 事件委托，非每帧写） */
    __skillsActive?: number;
    /** 3D 层读到的当前激活索引探针（E2E 断言） */
    __skillsHover?: number;
    /** 当前悬停技能所属领域（kebab），由事件驱动写入 */
    __skillsCategory?: string;
  }
}

const CLUSTER_COLORS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#60a5fa', '#f472b6'];

/** 卸载时释放 GPU 资源（与 US-006e / US-012g / US-013f 同模式） */
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
 * US-007f：3D 技能星图概念视觉层。
 * 六个领域各成一个聚簇，技能节点围绕聚簇中心分布，连线表示归属关系。
 * DOM hover/focus 写 window.__skillsActive / __skillsCategory，
 * useFrame 只读这两个值做插值：节点放大发光、同领域中心提亮。
 * 性能红线：useFrame 内零布局读取、零 dataset 写入、零 setState。
 */
export default function SkillsStarScene({
  counts,
  reducedMotion,
  onFrame,
}: SkillsStarSceneProps) {
  const tint = useSectionTint().particle;
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const centerRefs = useRef<(THREE.Mesh | null)[]>([]);

  const layout = useMemo(() => {
    const centers = SKILL_CATEGORIES.map((_, index) => {
      const angle = (index / SKILL_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
      return new THREE.Vector3(
        Math.cos(angle) * 2.05,
        Math.sin(angle) * 1.12,
        Math.sin(angle * 2) * 0.14,
      );
    });
    const nodes: { position: THREE.Vector3; cluster: number }[] = [];
    centers.forEach((center, cluster) => {
      const count = counts[cluster] ?? 0;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / Math.max(count, 1)) * Math.PI * 2;
        const radius = 0.44 + (i % 2) * 0.1;
        nodes.push({
          cluster,
          position: new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            center.y + Math.sin(angle) * radius,
            center.z + (i % 3) * 0.07,
          ),
        });
      }
    });
    return { centers, nodes };
  }, [counts]);

  const linkGeometry = useMemo(() => {
    const points: number[] = [];
    for (const node of layout.nodes) {
      const center = layout.centers[node.cluster];
      points.push(center.x, center.y, center.z, node.position.x, node.position.y, node.position.z);
    }
    layout.centers.forEach((center, index) => {
      const next = layout.centers[(index + 1) % layout.centers.length];
      points.push(center.x, center.y, center.z, next.x, next.y, next.z);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [layout]);

  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.074, 10, 8), []);
  const centerGeometry = useMemo(() => new THREE.SphereGeometry(0.17, 14, 10), []);

  useFrame((_, delta) => {
    onFrame();
    const active = window.__skillsActive ?? -1;
    const category = window.__skillsCategory ?? '';
    const step = Math.min(1, delta * 8);

    if (groupRef.current && !reducedMotion) groupRef.current.rotation.y += delta * 0.06;

    nodeRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const highlighted = index === active;
      const targetScale = highlighted ? 1.85 : 1;
      const scale = mesh.scale.x + (targetScale - mesh.scale.x) * step;
      mesh.scale.setScalar(scale);
      const material = mesh.material as THREE.MeshStandardMaterial;
      const targetGlow = highlighted ? 0.9 : 0.18;
      material.emissiveIntensity += (targetGlow - material.emissiveIntensity) * step;
    });

    centerRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const highlighted = SKILL_CATEGORIES[index] === category;
      const targetScale = highlighted ? 1.35 : 1;
      const scale = mesh.scale.x + (targetScale - mesh.scale.x) * step;
      mesh.scale.setScalar(scale);
      const material = mesh.material as THREE.MeshStandardMaterial;
      const targetGlow = highlighted ? 0.85 : 0.32;
      material.emissiveIntensity += (targetGlow - material.emissiveIntensity) * step;
    });
  });

  return (
    <group ref={groupRef}>
      {layout.centers.map((center, index) => (
        <group key={SKILL_CATEGORIES[index]} position={[center.x, center.y, center.z]}>
          <mesh
            ref={(element) => {
              centerRefs.current[index] = element;
            }}
            geometry={centerGeometry}
          >
            <meshStandardMaterial
              color="#121130"
              emissive={CLUSTER_COLORS[index]}
              emissiveIntensity={0.32}
              metalness={0.45}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
      {layout.nodes.map((node, index) => (
        <mesh
          key={`${node.cluster}-${index}`}
          ref={(element) => {
            nodeRefs.current[index] = element;
          }}
          position={[node.position.x, node.position.y, node.position.z]}
          geometry={nodeGeometry}
        >
          <meshStandardMaterial
            color="#121130"
            emissive={CLUSTER_COLORS[node.cluster]}
            emissiveIntensity={0.18}
            metalness={0.4}
            roughness={0.45}
          />
        </mesh>
      ))}
      <lineSegments geometry={linkGeometry}>
        <lineBasicMaterial color={tint} transparent opacity={0.26} />
      </lineSegments>
      <ambientLight intensity={0.75} />
      <pointLight position={[2.2, 2.6, 3.4]} intensity={12} color={tint} />
      <DisposeOnUnmount />
    </group>
  );
}

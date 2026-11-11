'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

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

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#8f9bff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Core() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.15;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.12;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
  });
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color="#14112b" emissive="#7c6cff" emissiveIntensity={0.18} flatShading roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh scale={1.25}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Orbits() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.05;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.2, 0.008, 8, 96]} />
        <meshBasicMaterial color="#7c6cff" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 1.9, 0.4, 0]}>
        <torusGeometry args={[2.9, 0.006, 8, 96]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

export default function HeroScene({ particles }: { particles: number }) {
  const ready = useRef(false);
  useFrame(({ gl }) => {
    if (!ready.current) {
      ready.current = true;
      gl.domElement.dataset.ready = '1';
    }
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 5]} intensity={30} color="#7c6cff" />
      <pointLight position={[-5, -2, 3]} intensity={16} color="#22d3ee" />
      <Core />
      <Orbits />
      <Particles count={particles} />
      <gridHelper args={[30, 30, '#2a2f55', '#161a38']} position={[0, -2.6, 0]} />
    </>
  );
}
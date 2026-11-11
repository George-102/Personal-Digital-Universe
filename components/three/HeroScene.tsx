'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp, damp, repelFactor, type Vec2, type PointerTracker } from '@/lib/pointer';
import { findInteractiveObject, type InteractiveObject } from '@/lib/interactive';
import { sharedScrollState } from '@/lib/scroll';
import { cameraTargets, findTransitionSegment, shellFactor, transitionSegments } from '@/lib/transitions';

/** 每帧上报给 DOM 层的可观察状态（E2E 断言与 tooltip 定位都以此为准） */
export type FrameReport = {
  parallax: Vec2;
  particleOffset: Vec2;
  hoverGlow: number;
  hoverScale: number;
  spinSpeed: number;
  dragRotation: Vec2;
  ndc: Vec2;
  hitCore: Vec2;
  hitOrbitNode: Vec2;
  /** 滚动转场：平滑后的段进度与相机/物体目标偏移（来自注册表配置） */
  transitionProgress: number;
  cameraZ: number;
  coreOffsetY: number;
  coreSpinOffset: number;
  /** 粒子壳层系数：1 原半径，<1 聚集、>1 扩散 */
  particleShell: number;
};

type RefLike<T> = { current: T };

export type HeroSceneProps = {
  particles: number;
  pointer: PointerTracker | null;
  objects: readonly InteractiveObject[];
  hoverId: string | null;
  dragTarget: RefLike<Vec2>;
  reducedMotion: boolean;
  lowQuality: boolean;
  onFrame: (report: FrameReport) => void;
  onHover: (id: string | null) => void;
  onPress: (id: string) => void;
};

const PARALLAX_X = 0.22;
const PARALLAX_Y = 0.14;
const PARALLAX_MAX_STEP = 0.08;
const GLOW_BASE = 0.18;
const GLOW_HOVER = 0.6;
const SCALE_HOVER = 1.08;
const SPIN_HOVER = 1.9;
const PARTICLE_RADIUS = 1.2;
const PARTICLE_STRENGTH = 0.35;

// 转场参数只从注册表读取（US-003b），组件内不硬编码
const heroSegment = findTransitionSegment(transitionSegments, 'hero-about');
const cameraConfig = heroSegment?.camera ?? { zOffset: 0, coreSpin: 0, coreYOffset: 0 };
const particlesConfig = heroSegment?.particles ?? { shellScale: 1 };

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

function Particles({
  count,
  offsetRef,
  shellRef,
}: {
  count: number;
  offsetRef: RefLike<Vec2>;
  shellRef: RefLike<number>;
}) {
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
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.position.x = offsetRef.current.x * 0.6;
    ref.current.position.y = offsetRef.current.y * 0.6;
    // 转场聚集/扩散：整体壳层缩放，不改粒子数量与逐粒子计算
    ref.current.scale.setScalar(shellRef.current);
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

export default function HeroScene({
  particles,
  pointer,
  objects,
  hoverId,
  dragTarget,
  reducedMotion,
  lowQuality,
  onFrame,
  onHover,
  onPress,
}: HeroSceneProps) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const ready = useRef(false);
  const coreGroup = useRef<THREE.Group>(null);
  const coreMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const orbitMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const projection = useMemo(() => new THREE.Vector3(), []);
  const particleOffset = useRef<Vec2>({ x: 0, y: 0 });
  const cameraBase = useRef<{ z: number } | null>(null);
  const shellRef = useRef(1);

  const motion = useRef({
    parallax: { x: 0, y: 0 } as Vec2,
    particle: { x: 0, y: 0 } as Vec2,
    glow: GLOW_BASE,
    scale: 1,
    spin: 1,
    drag: { x: 0, y: 0 } as Vec2,
    baseSpin: 0,
    shell: 1,
  });

  useFrame((state, delta) => {
    const m = motion.current;
    const snapshot = pointer?.getSnapshot() ?? null;
    const ndc = snapshot?.ndc ?? { x: 0, y: 0 };
    const hovered = findInteractiveObject(objects, hoverId);
    const has = (feedback: InteractiveObject['hoverFeedback'][number]) =>
      hovered?.hoverFeedback.includes(feedback) ?? false;
    const dt = Math.min(delta, 0.1);

    // 视差：目标经单帧限幅后再 damp 平滑，快速甩动不产生突跳
    const targetX = reducedMotion ? 0 : clamp(ndc.x * PARALLAX_X, -PARALLAX_X, PARALLAX_X);
    const targetY = reducedMotion ? 0 : clamp(ndc.y * PARALLAX_Y, -PARALLAX_Y, PARALLAX_Y);
    const stepX = clamp(targetX - m.parallax.x, -PARALLAX_MAX_STEP, PARALLAX_MAX_STEP);
    const stepY = clamp(targetY - m.parallax.y, -PARALLAX_MAX_STEP, PARALLAX_MAX_STEP);
    m.parallax.x = damp(m.parallax.x, m.parallax.x + stepX, 6, dt);
    m.parallax.y = damp(m.parallax.y, m.parallax.y + stepY, 6, dt);

    // 粒子排斥：低画质档与 reduced-motion 下关闭
    const repel = reducedMotion || lowQuality
      ? 0
      : repelFactor(Math.hypot(ndc.x, ndc.y), PARTICLE_RADIUS, PARTICLE_STRENGTH);
    m.particle.x = damp(m.particle.x, ndc.x * repel, 4, dt);
    m.particle.y = damp(m.particle.y, ndc.y * repel, 4, dt);
    particleOffset.current.x = m.particle.x;
    particleOffset.current.y = m.particle.y;

    // 悬停四种反馈：插值过渡，reduced-motion 时直接切状态
    const glowTarget = has('glow') ? GLOW_HOVER : GLOW_BASE;
    const scaleTarget = has('scale') ? SCALE_HOVER : 1;
    const spinTarget = has('spin') ? SPIN_HOVER : 1;
    if (reducedMotion) {
      m.glow = glowTarget;
      m.scale = scaleTarget;
      m.spin = spinTarget;
    } else {
      m.glow = damp(m.glow, glowTarget, 8, dt);
      m.scale = damp(m.scale, scaleTarget, 8, dt);
      m.spin = damp(m.spin, spinTarget, 5, dt);
    }

    // 拖拽旋转：目标由 DOM 层累加，这里平滑跟随，松手后自然停下（惯性）
    m.drag.x = damp(m.drag.x, dragTarget.current.x, reducedMotion ? 100 : 8, dt);
    m.drag.y = damp(m.drag.y, dragTarget.current.y, reducedMotion ? 100 : 8, dt);

    // 常驻慢速旋转 + 拖拽叠加，速度上限防止 hover 与拖拽叠加超速
    m.baseSpin += dt * 0.15 * Math.min(m.spin, 2.2);

    // 滚动转场：进度来自单一进度源（已 damp 平滑），目标偏移来自注册表配置；
    // reduced-motion 简化为无相机运动（Tech.md §3.3），叠加式施加避免与视差/拖拽冲突
    const scrollProgress = sharedScrollState.getSnapshot().progress;
    const transition = reducedMotion ? 0 : scrollProgress;
    const targets = cameraTargets(transition, cameraConfig);
    if (!cameraBase.current) cameraBase.current = { z: camera.position.z };
    camera.position.z = cameraBase.current.z + targets.z;

    // 粒子聚集/扩散：低画质档与 reduced-motion 下关闭（保持原半径），damp 平滑后回稳
    const shellTarget =
      reducedMotion || lowQuality ? 1 : shellFactor(scrollProgress, particlesConfig);
    m.shell = damp(m.shell, shellTarget, 6, dt);
    shellRef.current = m.shell;

    if (coreGroup.current) {
      coreGroup.current.rotation.y = m.baseSpin + m.drag.x + targets.spin;
      coreGroup.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.12 + m.parallax.y * 0.4 + m.drag.y;
      coreGroup.current.position.x = m.parallax.x;
      coreGroup.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.6) * 0.15 + m.parallax.y * 0.5 + targets.y;
      coreGroup.current.scale.setScalar(m.scale);
    }
    if (coreMaterial.current) {
      coreMaterial.current.emissiveIntensity = hoverId === 'core' ? m.glow : GLOW_BASE;
    }
    if (orbitMaterial.current) {
      orbitMaterial.current.emissiveIntensity = hoverId === 'orbit-node' ? m.glow : GLOW_BASE;
    }

    if (!ready.current) {
      ready.current = true;
      gl.domElement.dataset.ready = '1';
    }

    // 物体屏幕投影：用固定世界坐标，避免与视差形成反馈循环
    const rect = gl.domElement.getBoundingClientRect();
    const toScreen = (x: number, y: number, z: number): Vec2 => {
      projection.set(x, y, z).project(camera);
      return {
        x: rect.left + (projection.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-projection.y * 0.5 + 0.5) * rect.height,
      };
    };

    onFrame({
      parallax: { ...m.parallax },
      particleOffset: { ...m.particle },
      hoverGlow: m.glow,
      hoverScale: m.scale,
      spinSpeed: m.spin,
      dragRotation: { ...m.drag },
      ndc: { ...ndc },
      hitCore: toScreen(0, 0, 0),
      hitOrbitNode: toScreen(2.2, 0.9, 0),
      transitionProgress: transition,
      cameraZ: targets.z,
      coreOffsetY: targets.y,
      coreSpinOffset: targets.spin,
      particleShell: m.shell,
    });
  });

  return (
    <>
      <DisposeOnUnmount />
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 5]} intensity={30} color="#7c6cff" />
      <pointLight position={[-5, -2, 3]} intensity={16} color="#22d3ee" />
      <group
        ref={coreGroup}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover('core');
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPress('core');
        }}
      >
        <mesh>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial
            ref={coreMaterial}
            color="#14112b"
            emissive="#7c6cff"
            emissiveIntensity={GLOW_BASE}
            flatShading
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        <mesh scale={1.25}>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} />
        </mesh>
      </group>
      <mesh
        position={[2.2, 0.9, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover('orbit-node');
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPress('orbit-node');
        }}
      >
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          ref={orbitMaterial}
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={GLOW_BASE}
          roughness={0.35}
        />
      </mesh>
      <Orbits />
      <Particles count={particles} offsetRef={particleOffset} shellRef={shellRef} />
      <gridHelper args={[30, 30, '#2a2f55', '#161a38']} position={[0, -2.6, 0]} />
    </>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { useCallback } from 'react';
import type { QualityTier } from '@/lib/quality';

const ProjectsCardsScene = dynamic(
  () => import('@/components/three/ProjectsCardsScene'),
  { ssr: false },
);

type Props = {
  count: number;
  tier: QualityTier;
  reducedMotion: boolean;
  active: boolean;
  onCreated: () => void;
};

/** US-012g：R3F Canvas 单独成 chunk，只在门控层判定通过后载入。 */
export default function ProjectsStage({
  count,
  tier,
  reducedMotion,
  active,
  onCreated,
}: Props) {
  const handleFrame = useCallback(() => {
    window.__projectsFrames = (window.__projectsFrames ?? 0) + 1;
  }, []);

  return (
    <Canvas
      dpr={tier.pixelRatio}
      frameloop={active ? (reducedMotion ? 'demand' : 'always') : 'never'}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
      onCreated={onCreated}
    >
      <ProjectsCardsScene
        count={count}
        reducedMotion={reducedMotion}
        onFrame={handleFrame}
      />
    </Canvas>
  );
}

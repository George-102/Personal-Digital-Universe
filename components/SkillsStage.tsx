'use client';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { useCallback } from 'react';
import type { QualityTier } from '@/lib/quality';

const SkillsStarScene = dynamic(() => import('@/components/three/SkillsStarScene'), { ssr: false });

type Props = {
  counts: number[];
  tier: QualityTier;
  reducedMotion: boolean;
  active: boolean;
  onCreated: () => void;
};

/** US-007f：R3F Canvas 单独成 chunk，只在门控层判定通过后载入。 */
export default function SkillsStage({
  counts,
  tier,
  reducedMotion,
  active,
  onCreated,
}: Props) {
  const handleFrame = useCallback(() => {
    window.__skillsFrames = (window.__skillsFrames ?? 0) + 1;
  }, []);

  return (
    <Canvas
      dpr={tier.pixelRatio}
      frameloop={active ? (reducedMotion ? 'demand' : 'always') : 'never'}
      camera={{ position: [0, 0, 5.8], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
      onCreated={onCreated}
    >
      <SkillsStarScene counts={counts} reducedMotion={reducedMotion} onFrame={handleFrame} />
    </Canvas>
  );
}

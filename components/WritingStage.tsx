'use client';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { useCallback } from 'react';
import type { QualityTier } from '@/lib/quality';

const WritingShelfScene = dynamic(
  () => import('@/components/three/WritingShelfScene'),
  { ssr: false },
);

type Props = {
  count: number;
  tier: QualityTier;
  reducedMotion: boolean;
  active: boolean;
  onCreated: () => void;
};

/** US-014f：R3F Canvas 单独成 chunk，只在门控层判定通过后载入。 */
export default function WritingStage({
  count,
  tier,
  reducedMotion,
  active,
  onCreated,
}: Props) {
  const handleFrame = useCallback(() => {
    window.__writingFrames = (window.__writingFrames ?? 0) + 1;
  }, []);

  return (
    <Canvas
      dpr={tier.pixelRatio}
      frameloop={active ? (reducedMotion ? 'demand' : 'always') : 'never'}
      camera={{ position: [0, 0, 4.6], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
      onCreated={onCreated}
    >
      <WritingShelfScene count={count} reducedMotion={reducedMotion} onFrame={handleFrame} />
    </Canvas>
  );
}

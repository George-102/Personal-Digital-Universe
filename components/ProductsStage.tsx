'use client';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { useCallback } from 'react';
import type { QualityTier } from '@/lib/quality';

const ProductShowcaseScene = dynamic(
  () => import('@/components/three/ProductShowcaseScene'),
  { ssr: false },
);

type Props = {
  count: number;
  tier: QualityTier;
  reducedMotion: boolean;
  active: boolean;
  onCreated: () => void;
};

/** US-013f：R3F Canvas 单独成 chunk，只在门控层判定通过后载入。 */
export default function ProductsStage({
  count,
  tier,
  reducedMotion,
  active,
  onCreated,
}: Props) {
  const handleFrame = useCallback(() => {
    window.__productsFrames = (window.__productsFrames ?? 0) + 1;
  }, []);

  return (
    <Canvas
      dpr={tier.pixelRatio}
      frameloop={active ? (reducedMotion ? 'demand' : 'always') : 'never'}
      camera={{ position: [0, 0, 5.8], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
      onCreated={onCreated}
    >
      <ProductShowcaseScene
        count={count}
        reducedMotion={reducedMotion}
        onFrame={handleFrame}
      />
    </Canvas>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import type { QualityTier } from '@/lib/quality';

const ResearchAirspaceScene = dynamic(
  () => import('@/components/three/ResearchAirspaceScene'),
  { ssr: false },
);

type Props = {
  tier: QualityTier;
  reducedMotion: boolean;
  /** 离屏时 frameloop=never（帧计数探针随即停止） */
  active: boolean;
  onCreated: () => void;
};

/**
 * US-010k：3D 舞台单独成 chunk。首页 hydration 阶段只加载轻量门控 ResearchCanvas，
 * 只有满足全部挂载门槛后才动态载入本组件与 R3F Canvas，避免增加首屏 TBT。
 */
export default function ResearchStage({ tier, reducedMotion, active, onCreated }: Props) {
  const handleFrame = useCallback(() => {
    window.__researchFrames = (window.__researchFrames ?? 0) + 1;
  }, []);

  return (
    <Canvas
      dpr={tier.pixelRatio}
      frameloop={active ? (reducedMotion ? 'demand' : 'always') : 'never'}
      camera={{ position: [0, 2.6, 4.8], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
      onCreated={onCreated}
    >
      <ResearchAirspaceScene
        lowQuality={tier.particles < 700}
        reducedMotion={reducedMotion}
        onFrame={handleFrame}
      />
    </Canvas>
  );
}

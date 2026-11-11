'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier } from '@/lib/quality';

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false });

export default function HeroCanvas() {
  const [tier, setTier] = useState<{ particles: number; pixelRatio: number } | null>(null);

  useEffect(() => {
    if (!isWebGLAvailable()) return;
    setTier(getQualityTier(window.innerWidth, window.devicePixelRatio || 1));
  }, []);

  if (!tier) return null;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={tier.pixelRatio}
        camera={{ position: [0, 0.6, 7], fov: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <HeroScene particles={tier.particles} />
      </Canvas>
    </div>
  );
}
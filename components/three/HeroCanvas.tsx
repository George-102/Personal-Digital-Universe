'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier } from '@/lib/quality';

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false });

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroCanvas() {
  const [tier, setTier] = useState<{ particles: number; pixelRatio: number } | null>(null);
  const [inView, setInView] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const restoreAttempted = useRef(false);

  useEffect(() => {
    if (!isWebGLAvailable()) return;
    setTier(getQualityTier(window.innerWidth, window.devicePixelRatio || 1));
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tier]);

  if (!tier) return null;

  return (
    <div ref={wrapperRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <SceneErrorBoundary>
        <Canvas
          dpr={tier.pixelRatio}
          frameloop={inView ? 'always' : 'never'}
          camera={{ position: [0, 0.6, 7], fov: 50 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const context = gl.getContext();
            const loseExt = context.getExtension('WEBGL_lose_context');
            canvas.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              if (restoreAttempted.current) {
                setTier(null);
                return;
              }
              restoreAttempted.current = true;
              setTimeout(() => {
                try {
                  loseExt?.restoreContext();
                } catch {
                  setTier(null);
                }
              }, 250);
              setTimeout(() => {
                if (context.isContextLost()) setTier(null);
              }, 2000);
            });
            canvas.addEventListener('webglcontextrestored', () => {
              restoreAttempted.current = false;
            });
          }}
        >
          <HeroScene particles={tier.particles} />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
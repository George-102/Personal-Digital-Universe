'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { readViewportQuality, type QualityTier } from '@/lib/quality';
import { useAdaptiveTier } from '@/components/useAdaptiveTier';

const JourneyOrbitScene = dynamic(() => import('@/components/three/JourneyOrbitScene'), {
  ssr: false,
});

/** 场景 chunk 加载/渲染失败时静默降级：3D 是装饰，不能拖垮时间线 */
class OrbitErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

declare global {
  interface Window {
    /** 轨道渲染帧计数探针（E2E 读取） */
    __journeyFrames?: number;
  }
}

type Props = {
  count: number;
  activeIndex: number | null;
};

/**
 * US-008d/e：时间线的 3D 装饰层。
 * 与 DOM 时间轴完全解耦：这里的任何失败都不影响阅读（失败即不渲染）。
 * 只有同时满足「已离开首屏 + 桌面视口 + 无 reduced-motion + WebGL 可用 + 进入视口」才挂载 Canvas。
 * 「已离开首屏」是 2026-11-15 云端 TBT 回归后加的门槛：Lighthouse 全页截图会扩展视口，
 * 让 IntersectionObserver 误判 #journey 已可见，从而在 TBT 窗口内编译第二个 WebGL 上下文。
 */
export default function JourneyCanvas({ count, activeIndex }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frames = useRef(0);
  const [desktop, setDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [leftHero, setLeftHero] = useState(false);
  const leftHeroRef = useRef(false);
  const [baseTier, setBaseTier] = useState<QualityTier | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'off' | 'pending' | '3d' | 'no-webgl' | 'error'>('off');
  const tier = useAdaptiveTier(
    baseTier,
    Boolean(baseTier && leftHero && desktop && !reducedMotion && inView),
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setDesktop(desktopQuery.matches);
      setReducedMotion(motionQuery.matches);
    };
    sync();
    desktopQuery.addEventListener('change', sync);
    motionQuery.addEventListener('change', sync);
    return () => {
      desktopQuery.removeEventListener('change', sync);
      motionQuery.removeEventListener('change', sync);
    };
  }, []);

  // 只在「用户真正滚离首屏」后放行；一次性判定，滚动期间不产生每帧 setState
  useEffect(() => {
    const onScroll = () => {
      if (leftHeroRef.current || window.scrollY <= 0) return;
      leftHeroRef.current = true;
      setLeftHero(true);
      window.removeEventListener('scroll', onScroll);
    };
    onScroll();
    if (!leftHeroRef.current) window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // WebGL 探测延后到「真正要挂载」时，避免首屏创建一次性上下文
  useEffect(() => {
    if (!leftHero || !desktop || reducedMotion || !inView || baseTier) return;
    if (!isWebGLAvailable()) {
      setMode('no-webgl');
      return;
    }
    setBaseTier(readViewportQuality());
    setMode('pending');
  }, [leftHero, desktop, reducedMotion, inView, baseTier]);

  useEffect(() => {
    if (tier && leftHero && desktop && !reducedMotion && inView) setMounted(true);
  }, [tier, leftHero, desktop, reducedMotion, inView]);

  const handleFrame = useCallback(() => {
    frames.current += 1;
    // 探针走 window：每帧写 dataset 会让样式失效（US-006 教训）
    window.__journeyFrames = frames.current;
  }, []);

  const handleCreated = useCallback(() => setMode('3d'), []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-journey-canvas
      data-journey-mode={mode}
      data-journey-active={activeIndex ?? ''}
      className="journey-canvas"
    >
      {mounted && tier ? (
        <OrbitErrorBoundary onError={() => setMode('error')}>
          <Canvas
            dpr={tier.pixelRatio}
            frameloop={inView ? (reducedMotion ? 'demand' : 'always') : 'never'}
            camera={{ position: [0, 0, 6.2], fov: 42 }}
            gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
            style={{ pointerEvents: 'none' }}
            onCreated={handleCreated}
          >
            <JourneyOrbitScene
              count={count}
              activeIndex={activeIndex}
              lowQuality={tier.particles < 700}
              reducedMotion={reducedMotion}
              onFrame={handleFrame}
            />
          </Canvas>
        </OrbitErrorBoundary>
      ) : null}
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier, type QualityTier } from '@/lib/quality';

const ResearchAirspaceScene = dynamic(
  () => import('@/components/three/ResearchAirspaceScene'),
  { ssr: false },
);

/** 场景 chunk 加载/渲染失败静默降级：3D 是概念示意，不影响研究文字（PRD 验收 4） */
class ResearchErrorBoundary extends Component<
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
    /** Research 空域场景渲染帧计数探针（E2E 读取） */
    __researchFrames?: number;
  }
}

type Props = {
  /**
   * 首页需要「已离开首屏」门槛（US-008k TBT 教训）；
   * 独立 /research 页没有 hero，进入视口即可挂载。
   */
  requireLeftHero?: boolean;
};

/**
 * US-010f：Research 的 3D 空域概念示意层。
 * 挂载门槛：桌面 + 无 reduced-motion + WebGL 可用 + 进入视口（+ 首页时已离开首屏）。
 * 父容器 aria-hidden，全部信息在 DOM；概念性标注由 ResearchSection 提供。
 */
export default function ResearchCanvas({ requireLeftHero = true }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frames = useRef(0);
  const [desktop, setDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [leftHero, setLeftHero] = useState(false);
  const leftHeroRef = useRef(false);
  const [tier, setTier] = useState<QualityTier | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'off' | 'pending' | '3d' | 'no-webgl' | 'error'>('off');

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

  // 一次性判定「用户真正滚离首屏」（requireLeftHero 时生效）
  useEffect(() => {
    if (!requireLeftHero) {
      setLeftHero(true);
      return;
    }
    const onScroll = () => {
      if (leftHeroRef.current || window.scrollY <= 0) return;
      leftHeroRef.current = true;
      setLeftHero(true);
      window.removeEventListener('scroll', onScroll);
    };
    onScroll();
    if (!leftHeroRef.current) window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [requireLeftHero]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // WebGL 探测延后到真正要挂载时，避免首屏创建一次性上下文
  useEffect(() => {
    if (!leftHero || !desktop || reducedMotion || !inView || tier) return;
    if (!isWebGLAvailable()) {
      setMode('no-webgl');
      return;
    }
    setTier(getQualityTier(window.innerWidth, window.devicePixelRatio || 1));
    setMode('pending');
  }, [leftHero, desktop, reducedMotion, inView, tier]);

  useEffect(() => {
    if (tier && leftHero && desktop && !reducedMotion && inView) setMounted(true);
  }, [tier, leftHero, desktop, reducedMotion, inView]);

  const handleFrame = useCallback(() => {
    frames.current += 1;
    window.__researchFrames = frames.current;
  }, []);

  const handleCreated = useCallback(() => setMode('3d'), []);

  return (
    <div
      ref={wrapperRef}
      className="research-3d"
      data-research-3d
      data-research-mode={mode}
      aria-hidden="true"
    >
      {mounted && tier ? (
        <ResearchErrorBoundary onError={() => setMode('error')}>
          <Canvas
            dpr={tier.pixelRatio}
            frameloop={inView ? (reducedMotion ? 'demand' : 'always') : 'never'}
            camera={{ position: [0, 2.6, 4.8], fov: 42 }}
            gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
            onCreated={handleCreated}
          >
            <ResearchAirspaceScene
              lowQuality={tier.particles < 700}
              reducedMotion={reducedMotion}
              onFrame={handleFrame}
            />
          </Canvas>
        </ResearchErrorBoundary>
      ) : null}
    </div>
  );
}

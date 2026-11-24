'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';
import { readViewportQuality, type QualityTier } from '@/lib/quality';
import { useAdaptiveTier } from '@/components/useAdaptiveTier';

/** US-010k：R3F Canvas 与场景只在全部挂载门槛满足后才进入首屏之后的 chunk。 */
const ResearchStage = dynamic(() => import('@/components/ResearchStage'), { ssr: false });

/** chunk 加载/渲染失败静默降级：3D 是概念示意，不影响研究文字（PRD 验收 4） */
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

type Mode = 'off' | 'pending' | '3d' | 'no-webgl' | 'error';

/**
 * US-010k：轻量门控层。 hydration 时不引入 R3F Canvas；只在桌面 + 无 reduced-motion
 * + WebGL + 进入视口（+ 首页已离开首屏）后动态载入 ResearchStage。
 * 父容器 aria-hidden，全部信息在 DOM；概念性标注由 ResearchSection 提供。
 */
export default function ResearchCanvas({ requireLeftHero = true }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftHeroRef = useRef(false);
  const checkedRef = useRef(false);
  const [desktop, setDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [leftHero, setLeftHero] = useState(false);
  const [baseTier, setBaseTier] = useState<QualityTier | null>(null);
  const [mode, setMode] = useState<Mode>('off');
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
    if (!leftHero || !desktop || reducedMotion || !inView || checkedRef.current) return;
    checkedRef.current = true;
    if (!isWebGLAvailable()) {
      setMode('no-webgl');
      return;
    }
    setBaseTier(readViewportQuality());
    setMode('pending');
  }, [leftHero, desktop, reducedMotion, inView]);

  const handleCreated = useCallback(() => setMode('3d'), []);
  const handleError = useCallback(() => setMode('error'), []);

  return (
    <div
      ref={wrapperRef}
      className="research-3d"
      data-research-3d
      data-research-mode={mode}
      aria-hidden="true"
    >
      {tier && leftHero && desktop && !reducedMotion && inView ? (
        <ResearchErrorBoundary onError={handleError}>
          <ResearchStage
            tier={tier}
            reducedMotion={reducedMotion}
            active={inView}
            onCreated={handleCreated}
          />
        </ResearchErrorBoundary>
      ) : null}
    </div>
  );
}

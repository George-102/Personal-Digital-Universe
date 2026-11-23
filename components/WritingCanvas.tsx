'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier, type QualityTier } from '@/lib/quality';

/** US-014f：R3F Canvas 与场景在全部门槛满足后才进入首屏之后的 chunk。 */
const WritingStage = dynamic(() => import('@/components/WritingStage'), { ssr: false });

class WritingErrorBoundary extends Component<
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
    __writingFrames?: number;
  }
}

type Mode = 'off' | 'pending' | '3d' | 'no-webgl' | 'error';

/**
 * US-014f：轻量门控层。只由 /writing 列表页的独立视觉容器引入（首页 compact 不加载），
 * 桌面 + 无 reduced-motion + WebGL + 进入视口 + 已离开首屏时才动态载入 3D 舞台。
 * 父容器 aria-hidden，卡片信息全部在 DOM（PRD 红线）。
 */
export default function WritingCanvas({ count }: { count: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkedRef = useRef(false);
  const leftHeroRef = useRef(false);
  const [desktop, setDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [leftHero, setLeftHero] = useState(false);
  const [tier, setTier] = useState<QualityTier | null>(null);
  const [mode, setMode] = useState<Mode>('off');

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

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // US-008k/010k：一次性判定「已离开首屏」，避免 Lighthouse 全页截图扩展视口时误判可见，
  // 在 TBT 窗口内创建第二个 WebGL 上下文。passive 滚动只读 scrollY，不读布局。
  useEffect(() => {
    const update = () => {
      const left = window.scrollY > 0;
      if (left !== leftHeroRef.current) {
        leftHeroRef.current = left;
        setLeftHero(left);
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!desktop || reducedMotion || !inView || !leftHero || checkedRef.current) return;
    checkedRef.current = true;
    if (!isWebGLAvailable()) {
      setMode('no-webgl');
      return;
    }
    setTier(getQualityTier(window.innerWidth, window.devicePixelRatio || 1));
    setMode('pending');
  }, [desktop, reducedMotion, inView, leftHero]);

  const handleCreated = useCallback(() => setMode('3d'), []);
  const handleError = useCallback(() => setMode('error'), []);

  return (
    <div
      ref={wrapperRef}
      className="writing-3d"
      data-writing-3d
      data-writing-mode={mode}
      aria-hidden="true"
    >
      {tier && desktop && !reducedMotion && inView && leftHero ? (
        <WritingErrorBoundary onError={handleError}>
          <WritingStage
            count={count}
            tier={tier}
            reducedMotion={reducedMotion}
            active={inView}
            onCreated={handleCreated}
          />
        </WritingErrorBoundary>
      ) : null}
    </div>
  );
}

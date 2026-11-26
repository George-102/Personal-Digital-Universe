'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';
import { readViewportQuality, type QualityTier } from '@/lib/quality';
import { useAdaptiveTier } from '@/components/useAdaptiveTier';

/** US-007f：R3F Canvas 与场景在全部门槛满足后才进入首屏之后的 chunk。 */
const SkillsStage = dynamic(() => import('@/components/SkillsStage'), { ssr: false });

class SkillsErrorBoundary extends Component<
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
    __skillsFrames?: number;
  }
}

type Mode = 'off' | 'pending' | '3d' | 'no-webgl' | 'error';

/**
 * US-007f：轻量门控层。只由 /skills 列表页的独立视觉容器引入（首页 compact 不加载）。
 * 桌面 + 无 reduced-motion + WebGL + 进入视口时才动态载入 3D 舞台；
 * 首页若复用则需 scrollY>0 门槛（requireLeftHero），避免 Lighthouse 全页截图误判。
 * 父容器 aria-hidden，技能信息全部在 DOM（PRD 红线）。
 */
export default function SkillsCanvas({
  counts,
  requireLeftHero = false,
}: {
  counts: number[];
  requireLeftHero?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkedRef = useRef(false);
  const [desktop, setDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [leftHero, setLeftHero] = useState(!requireLeftHero);
  const [baseTier, setBaseTier] = useState<QualityTier | null>(null);
  const [mode, setMode] = useState<Mode>('off');
  const tier = useAdaptiveTier(
    baseTier,
    Boolean(baseTier && desktop && !reducedMotion && inView && leftHero),
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

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!requireLeftHero) return;
    const sync = () => setLeftHero(window.scrollY > 0);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, [requireLeftHero]);

  useEffect(() => {
    if (!desktop || reducedMotion || !inView || !leftHero || checkedRef.current) return;
    checkedRef.current = true;
    if (!isWebGLAvailable()) {
      setMode('no-webgl');
      return;
    }
    setBaseTier(readViewportQuality());
    setMode('pending');
  }, [desktop, reducedMotion, inView, leftHero]);

  const handleCreated = useCallback(() => setMode('3d'), []);
  const handleError = useCallback(() => setMode('error'), []);

  return (
    <div
      ref={wrapperRef}
      className="skills-3d"
      data-skills-3d
      data-skills-mode={mode}
      aria-hidden="true"
    >
      {tier && desktop && !reducedMotion && inView && leftHero ? (
        <SkillsErrorBoundary onError={handleError}>
          <SkillsStage
            counts={counts}
            tier={tier}
            reducedMotion={reducedMotion}
            active={inView}
            onCreated={handleCreated}
          />
        </SkillsErrorBoundary>
      ) : null}
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';
import { readViewportQuality, type QualityTier } from '@/lib/quality';
import { useAdaptiveTier } from '@/components/useAdaptiveTier';

/** US-013f：R3F Canvas 与场景在全部门槛满足后才进入首屏之后的 chunk。 */
const ProductsStage = dynamic(() => import('@/components/ProductsStage'), { ssr: false });

class ProductsErrorBoundary extends Component<
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
    __productsFrames?: number;
  }
}

type Mode = 'off' | 'pending' | '3d' | 'no-webgl' | 'error';

/**
 * US-013f：轻量门控层。只由 /products 列表页的独立视觉容器引入（首页 compact 不加载），
 * 桌面 + 无 reduced-motion + WebGL + 进入视口时才动态载入 3D 舞台。
 * 父容器 aria-hidden，卡片信息全部在 DOM（PRD 红线）。
 */
export default function ProductsCanvas({ count }: { count: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkedRef = useRef(false);
  const [desktop, setDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [baseTier, setBaseTier] = useState<QualityTier | null>(null);
  const [mode, setMode] = useState<Mode>('off');
  const tier = useAdaptiveTier(
    baseTier,
    Boolean(baseTier && desktop && !reducedMotion && inView),
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
    if (!desktop || reducedMotion || !inView || checkedRef.current) return;
    checkedRef.current = true;
    if (!isWebGLAvailable()) {
      setMode('no-webgl');
      return;
    }
    setBaseTier(readViewportQuality());
    setMode('pending');
  }, [desktop, reducedMotion, inView]);

  const handleCreated = useCallback(() => setMode('3d'), []);
  const handleError = useCallback(() => setMode('error'), []);

  return (
    <div
      ref={wrapperRef}
      className="products-3d"
      data-products-3d
      data-products-mode={mode}
      aria-hidden="true"
    >
      {tier && desktop && !reducedMotion && inView ? (
        <ProductsErrorBoundary onError={handleError}>
          <ProductsStage
            count={count}
            tier={tier}
            reducedMotion={reducedMotion}
            active={inView}
            onCreated={handleCreated}
          />
        </ProductsErrorBoundary>
      ) : null}
    </div>
  );
}

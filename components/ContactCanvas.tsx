'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier, type QualityTier } from '@/lib/quality';

const ContactOrbitScene = dynamic(() => import('@/components/three/ContactOrbitScene'), {
  ssr: false,
});

/** 场景 chunk 加载/渲染失败静默降级：3D 是装饰，不能影响联系方式（PRD 验收 4/5） */
class ContactErrorBoundary extends Component<
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
    /** Contact 场景渲染帧计数探针（E2E 读取） */
    __contactFrames?: number;
  }
}

/**
 * US-018f：Contact 的 3D 装饰层。
 * 只有「已离开首屏 + 桌面 + 无 reduced-motion + WebGL 可用 + 进入视口」五者同时满足才挂载 Canvas。
 * 「已离开首屏（scrollY>0）」是 US-008k 的云端 TBT 教训：Lighthouse 全页截图会扩展视口，
 * 若不加门槛会让非首屏 WebGL 上下文在 TBT 窗口内编译。
 */
export default function ContactCanvas() {
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

  // 一次性判定「用户真正滚离首屏」，滚动期间不产生每帧 setState
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
    window.__contactFrames = frames.current;
  }, []);

  const handleCreated = useCallback(() => setMode('3d'), []);

  return (
    <div
      ref={wrapperRef}
      className="contact-3d"
      data-contact-3d
      data-contact-mode={mode}
      aria-hidden="true"
    >
      {mounted && tier ? (
        <ContactErrorBoundary onError={() => setMode('error')}>
          <Canvas
            dpr={tier.pixelRatio}
            frameloop={inView ? (reducedMotion ? 'demand' : 'always') : 'never'}
            camera={{ position: [0, 0, 6], fov: 42 }}
            gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
            style={{ pointerEvents: 'none' }}
            onCreated={handleCreated}
          >
            <ContactOrbitScene
              lowQuality={tier.particles < 700}
              reducedMotion={reducedMotion}
              onFrame={handleFrame}
            />
          </Canvas>
        </ContactErrorBoundary>
      ) : null}
    </div>
  );
}

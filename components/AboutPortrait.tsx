'use client';

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { Canvas, type RootState } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier, type QualityTier } from '@/lib/quality';

const AboutAvatarScene = dynamic(() => import('@/components/three/AboutAvatarScene'), {
  ssr: false,
});

class AvatarErrorBoundary extends Component<
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

type Props = {
  label: string;
  alt: string;
  fallback: string;
};

/**
 * US-006d/e：3D 抽象头像容器。
 * - 静态 HTML 先渲染 SVG 抽象形象 + 文本替代，文字先于 3D（开发红线 1）。
 * - 只有 WebGL 可用且进入视口后才动态挂载 Canvas（不增加首屏成本）。
 * - WebGL 不可用 / 上下文丢失 / 场景 chunk 失败 → 回退静态形象，文字始终完整。
 * - 离屏 frameloop=never 暂停渲染，卸载时由场景显式 dispose GPU 资源。
 */
export default function AboutPortrait({ label, alt, fallback }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frames = useRef(0);
  const restoreAttempted = useRef(false);
  const [tier, setTier] = useState<QualityTier | null>(null);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'fallback' | '3d'>('fallback');
  const [reason, setReason] = useState('pending');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setReason('no-webgl');
      return;
    }
    setTier(getQualityTier(window.innerWidth, window.devicePixelRatio || 1));
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 首次进入视口才挂载 WebGL 上下文，避免首屏与 Hero 争抢资源
  useEffect(() => {
    if (tier && inView) setMounted(true);
  }, [tier, inView]);

  const handleFrame = useCallback(() => {
    frames.current += 1;
    if (frames.current % 10 === 0 && wrapperRef.current) {
      wrapperRef.current.dataset.avatarFrames = String(frames.current);
    }
  }, []);

  const handleFailure = useCallback((why: string) => {
    setReason(why);
    setMode('fallback');
    setMounted(false);
  }, []);

  const handleCreated = useCallback(
    ({ gl }: RootState) => {
      const canvas = gl.domElement;
      const context = gl.getContext();
      const loseExt = context.getExtension('WEBGL_lose_context');
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        if (restoreAttempted.current) {
          handleFailure('context-lost');
          return;
        }
        restoreAttempted.current = true;
        setTimeout(() => {
          try {
            loseExt?.restoreContext();
          } catch {
            handleFailure('context-lost');
          }
        }, 250);
        setTimeout(() => {
          if (context.isContextLost()) handleFailure('context-lost');
        }, 2000);
      });
      canvas.addEventListener('webglcontextrestored', () => {
        restoreAttempted.current = false;
      });
      setReason('3d');
      setMode('3d');
    },
    [handleFailure],
  );

  return (
    <div
      ref={wrapperRef}
      data-about-avatar
      data-avatar-mode={mode}
      data-avatar-reason={reason}
      data-avatar-frames="0"
      role="img"
      aria-label={label}
      aria-describedby="about-avatar-alt"
      className="about-avatar mx-auto w-full max-w-[260px]"
    >
      {/* 静态降级形象：无 JS / 无 WebGL / 上下文丢失时始终存在 */}
      <div className="about-avatar-fallback" aria-hidden="true">
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
          <defs>
            <radialGradient id="about-avatar-glow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#7c6cff" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#05060f" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="96" fill="url(#about-avatar-glow)" />
          <ellipse cx="100" cy="100" rx="86" ry="34" stroke="#7c6cff" strokeOpacity="0.5" transform="rotate(-24 100 100)" />
          <ellipse cx="100" cy="100" rx="86" ry="34" stroke="#22d3ee" strokeOpacity="0.35" transform="rotate(38 100 100)" />
          <path d="M100 44 146 71v54l-46 27-46-27V71z" stroke="#8f9bff" strokeWidth="1.5" fill="#14112b" fillOpacity="0.85" />
          <path d="M100 44 146 71 100 98 54 71zM100 98v54M54 71l46 27 46-27" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx="100" cy="100" r="5" fill="#22d3ee" />
        </svg>
      </div>

      {mounted && tier && (
        <div className="about-avatar-canvas" aria-hidden="true">
          <AvatarErrorBoundary onError={() => handleFailure('scene-error')}>
            <Canvas
              dpr={tier.pixelRatio}
              frameloop={inView ? (reducedMotion ? 'demand' : 'always') : 'never'}
              camera={{ position: [0, 0, 4.3], fov: 45 }}
              gl={{ antialias: true, powerPreference: 'low-power' }}
              style={{ pointerEvents: 'none' }}
              onCreated={handleCreated}
            >
              <AboutAvatarScene
                lowQuality={tier.particles < 700}
                reducedMotion={reducedMotion}
                onFrame={handleFrame}
              />
            </Canvas>
          </AvatarErrorBoundary>
        </div>
      )}

      <p id="about-avatar-alt" className="sr-only">
        {alt}
      </p>
      <p data-avatar-fallback-caption className="about-avatar-caption">
        {fallback}
      </p>
    </div>
  );
}

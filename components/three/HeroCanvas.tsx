'use client';

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable } from '@/lib/webgl';
import { getQualityTier } from '@/lib/quality';
import {
  attachPointerTracker,
  clamp,
  isClickGesture,
  type Gesture,
  type PointerSnapshot,
  type PointerTracker,
  type Vec2,
} from '@/lib/pointer';
import { findInteractiveObject, heroInteractiveObjects } from '@/lib/interactive';
import { sharedScrollState } from '@/lib/scroll';
import type { FrameReport } from '@/components/three/HeroScene';

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false });

export type InteractionLabels = { core: string; orbitNode: string };

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroCanvas({ labels }: { labels: InteractionLabels }) {
  const [tier, setTier] = useState<{ particles: number; pixelRatio: number } | null>(null);
  const [inView, setInView] = useState(true);
  // US-006h：页面变长后 hero 会真正滚出视口；离屏且滚动转场已收敛时才暂停渲染，
  // 否则 damp 未收敛就冻结状态会让相机/粒子/面板转场停在中途。
  const [settling, setSettling] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(true);
  const [tracker, setTracker] = useState<PointerTracker | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<PointerTracker | null>(null);
  const dragTargetRef = useRef<Vec2>({ x: 0, y: 0 });
  const hoverIdRef = useRef<string | null>(null);
  const pressTargetRef = useRef<string | null>(null);
  const clickCountRef = useRef(0);
  const restoreAttempted = useRef(false);
  // US-006h：渲染帧计数，用于实测「离屏且转场收敛后暂停渲染」
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!isWebGLAvailable()) return;
    setTier(getQualityTier(window.innerWidth, window.devicePixelRatio || 1));
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverQuery = window.matchMedia('(hover: hover)');
    const sync = () => {
      setReducedMotion(motionQuery.matches);
      setHoverCapable(hoverQuery.matches);
    };
    sync();
    motionQuery.addEventListener('change', sync);
    hoverQuery.addEventListener('change', sync);
    return () => {
      motionQuery.removeEventListener('change', sync);
      hoverQuery.removeEventListener('change', sync);
    };
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

  // ScrollDriver 的 RAF 独立于 R3F，离屏时仍会推进 damp；订阅进度差判断是否仍在收敛
  useEffect(
    () =>
      sharedScrollState.subscribe(({ raw, progress }) => {
        setSettling(Math.abs(raw - progress) > 0.002);
      }),
    [],
  );

  // Canvas 卸载（含上下文丢失转静态）时移除全部指针监听
  useEffect(
    () => () => {
      trackerRef.current?.destroy();
      trackerRef.current = null;
    },
    [tier],
  );

  const performClick = useCallback((id: string) => {
    const object = findInteractiveObject(heroInteractiveObjects, id);
    if (!object) return;
    const target = document.querySelector(object.clickTarget);
    if (!target) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', object.clickTarget);
    clickCountRef.current += 1;
    if (wrapperRef.current) {
      wrapperRef.current.dataset.clickCount = String(clickCountRef.current);
    }
  }, []);

  const handleGesture = useCallback(
    (gesture: Gesture) => {
      if (gesture.type === 'up') {
        const id = pressTargetRef.current ?? hoverIdRef.current;
        pressTargetRef.current = null;
        if (id && isClickGesture(gesture.travel, gesture.durationMs)) performClick(id);
        return;
      }
      if (gesture.type === 'cancel' || gesture.type === 'leave') {
        pressTargetRef.current = null;
      }
    },
    [performClick],
  );

  const handleMove = useCallback((snapshot: PointerSnapshot) => {
    if (!snapshot.dragging) return;
    const id = pressTargetRef.current ?? hoverIdRef.current;
    const object = findInteractiveObject(heroInteractiveObjects, id);
    if (!object?.draggable) return;
    dragTargetRef.current.x = clamp(dragTargetRef.current.x + snapshot.delta.x * 0.003, -1.2, 1.2);
    dragTargetRef.current.y = clamp(dragTargetRef.current.y + snapshot.delta.y * 0.003, -0.8, 0.8);
  }, []);

  const handleHover = useCallback((id: string | null) => {
    hoverIdRef.current = id;
    setHoverId(id);
  }, []);

  const handlePress = useCallback((id: string) => {
    pressTargetRef.current = id;
    hoverIdRef.current = id;
    setHoverId(id);
  }, []);

  // 每帧由 useFrame 调用一次：只写 DOM dataset，不触发 React 重渲染
  const handleFrame = useCallback((report: FrameReport) => {
    const el = wrapperRef.current;
    if (!el) return;
    const put = (key: string, value: string) => {
      if (el.dataset[key] !== value) el.dataset[key] = value;
    };
    const f = (n: number) => n.toFixed(3);
    frameCountRef.current += 1;
    // 逐帧写入（put 已做同值去重）：低帧率环境下按批次写会长时间停在旧值
    put('heroFrames', String(frameCountRef.current));
    put('parallaxX', f(report.parallax.x));
    put('parallaxY', f(report.parallax.y));
    put('particleX', f(report.particleOffset.x));
    put('particleY', f(report.particleOffset.y));
    put('hoverGlow', f(report.hoverGlow));
    put('hoverScale', f(report.hoverScale));
    put('spinSpeed', f(report.spinSpeed));
    put('dragX', f(report.dragRotation.x));
    put('dragY', f(report.dragRotation.y));
    put('ndcX', f(report.ndc.x));
    put('ndcY', f(report.ndc.y));
    put('transition', f(report.transitionProgress));
    put('cameraZ', f(report.cameraZ));
    put('coreOffsetY', f(report.coreOffsetY));
    put('coreSpinOffset', f(report.coreSpinOffset));
    put('particleShell', f(report.particleShell));
    put('hitCore', `${Math.round(report.hitCore.x)},${Math.round(report.hitCore.y)}`);
    put('hitOrbitNode', `${Math.round(report.hitOrbitNode.x)},${Math.round(report.hitOrbitNode.y)}`);

    const tip = tooltipRef.current;
    if (tip) {
      const point = hoverIdRef.current === 'orbit-node' ? report.hitOrbitNode : report.hitCore;
      const x = clamp(point.x + 16, 8, Math.max(8, window.innerWidth - tip.offsetWidth - 8));
      const y = clamp(point.y - 44, 8, Math.max(8, window.innerHeight - tip.offsetHeight - 8));
      tip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  }, []);

  if (!tier) {
    return (
      <div
        data-interaction-canvas
        data-interaction="disabled"
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
    );
  }

  const mode = reducedMotion ? 'reduced' : 'enabled';
  const tooltipText =
    hoverId === 'core' ? labels.core : hoverId === 'orbit-node' ? labels.orbitNode : '';
  const showTooltip = Boolean(tooltipText) && hoverCapable;

  return (
    <>
      <div
        ref={wrapperRef}
        data-interaction-canvas
        data-interaction={mode}
        data-hover-capable={hoverCapable ? 'true' : 'false'}
        data-hover={hoverId ?? ''}
        data-click-count={String(clickCountRef.current)}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <SceneErrorBoundary>
          <Canvas
            dpr={tier.pixelRatio}
            frameloop={inView || settling ? 'always' : 'never'}
            camera={{ position: [0, 0.6, 7], fov: 50 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            style={{ pointerEvents: 'auto' }}
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
                }, 4000);
              });
              canvas.addEventListener('webglcontextrestored', () => {
                restoreAttempted.current = false;
              });

              if (!trackerRef.current) {
                const created = attachPointerTracker(canvas, {
                  onGesture: handleGesture,
                  onMove: handleMove,
                });
                trackerRef.current = created;
                setTracker(created);
              }
            }}
          >
            <HeroScene
              particles={tier.particles}
              pointer={tracker}
              objects={heroInteractiveObjects}
              hoverId={hoverId}
              dragTarget={dragTargetRef}
              reducedMotion={reducedMotion}
              lowQuality={tier.particles < 700}
              onFrame={handleFrame}
              onHover={handleHover}
              onPress={handlePress}
            />
          </Canvas>
        </SceneErrorBoundary>
      </div>
      <div
        ref={tooltipRef}
        data-interaction-tooltip
        data-visible={showTooltip ? 'true' : 'false'}
        role="status"
        aria-live="polite"
        className={`interaction-tooltip${showTooltip ? ' is-visible' : ''}`}
      >
        {tooltipText}
      </div>
    </>
  );
}

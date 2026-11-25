'use client';

import { useEffect, useRef, useState } from 'react';
import { createAdaptiveState, degradeTier, nextAdaptiveState } from '@/lib/adaptive-quality';
import type { QualityTier } from '@/lib/quality';

/**
 * 共享运行时画质自适应 hook。
 * - 只有 base 已就绪且场景 active 时才采样，不增加首屏 hydration 成本。
 * - 采样回调只读 rAF 时间戳；跨阈值才 setState 一次，禁止每帧 DOM 读写。
 * - 降级后停止采样且不自动升回，避免反复抖动。
 */
export function useAdaptiveTier(base: QualityTier | null, active: boolean): QualityTier | null {
  const [degraded, setDegraded] = useState(false);
  const stateRef = useRef(createAdaptiveState());

  // 探针只在档位变化时写一次，不进入每帧回调；同一视口下各 3D 容器取值一致
  useEffect(() => {
    if (!base) return;
    window.__deviceTier = base.deviceClass;
  }, [base]);

  useEffect(() => {
    if (!base) return;
    window.__qualityTier = degraded ? degradeTier(base) : base;
  }, [base, degraded]);

  useEffect(() => {
    if (!active) stateRef.current = createAdaptiveState();
  }, [active]);

  useEffect(() => {
    if (!base || !active || degraded) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (last) {
        const next = nextAdaptiveState(stateRef.current, now - last);
        stateRef.current = next;
        if (next.degraded) {
          setDegraded(true);
          return;
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last = 0;
    };
  }, [base, active, degraded]);

  if (!base) return null;
  return degraded ? degradeTier(base) : base;
}

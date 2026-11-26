'use client';

import { useEffect, useRef } from 'react';
import { sectionVisualFor } from '@/lib/section-state';
import { sharedScrollState, type ScrollSnapshot } from '@/lib/scroll';

declare global {
  interface Window {
    __sectionTint?: string;
  }
}

/**
 * US-005b：导航栏下沿的细线进度指示器。
 * DOM 常驻、CSS 变量驱动视觉；aria-valuenow 在进度变化时写一次，
 * 不用 React state 触发每帧重渲染，也不拦截指针事件。
 */
export default function ScrollProgress({ label }: { label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(-1);
  const lastSection = useRef('');

  useEffect(() => {
    const apply = (snapshot: ScrollSnapshot) => {
      const root = rootRef.current;
      if (!root) return;
      const percent = Math.round(snapshot.overall * 100);
      if (percent !== lastValue.current) {
        lastValue.current = percent;
        root.setAttribute('aria-valuenow', String(percent));
      }
      if (snapshot.activeSection !== lastSection.current) {
        lastSection.current = snapshot.activeSection;
        const visual = sectionVisualFor(snapshot.activeSection);
        window.__sectionTint = visual.particle;
        root.setAttribute('data-active-section', snapshot.activeSection);
      }
    };
    apply(sharedScrollState.getSnapshot());
    return sharedScrollState.subscribe(apply);
  }, []);

  return (
    <div
      ref={rootRef}
      data-scroll-progress-indicator
      data-active-section="home"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      className="scroll-progress"
    >
      <div className="scroll-progress-fill" aria-hidden="true" />
    </div>
  );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  count: number;
  children: ReactNode;
};

declare global {
  interface Window {
    /** 当前悬停/聚焦的作品索引（-1 表示无）；3D 书架只读此探针，不触发 React 渲染 */
    __writingActive?: number;
    /** 指针 NDC 方向，事件驱动写入，供 3D 翻页/光照反馈读取 */
    __writingPointer?: { x: number; y: number };
    /** 3D 层 hover 探针：事件驱动写入，离屏暂停时仍准确 */
    __writingHover?: number;
  }
}

/**
 * US-014g：列表页交互层。卡片本体是服务端渲染的静态 HTML，
 * 这里只挂一层 document 事件委托：hover/focus 写入 3D 探针、指针方向归一化。
 * 不给每张卡片逐一绑定 React 合成事件（US-008k hydration 瘦身教训）。
 * 详情是独立路由，无 details 互斥逻辑。
 */
export default function WritingInteractions({ count, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-writing-item]'));
    if (window.__writingActive === undefined) window.__writingActive = -1;

    const indexOf = (target: EventTarget | null) => {
      const item =
        target instanceof Element ? target.closest<HTMLElement>('[data-writing-item]') : null;
      return item && root.contains(item) ? cards.indexOf(item) : -1;
    };

    const syncActive = (event: Event) => {
      const index = indexOf(event.target);
      cards.forEach((card, i) => {
        const value = i === index ? 'true' : 'false';
        if (card.dataset.active !== value) card.dataset.active = value;
      });
      if (window.__writingActive !== index) window.__writingActive = index;
      // 探针由事件驱动写入：3D 层离屏暂停（frameloop=never）时状态仍准确
      if (window.__writingHover !== index) window.__writingHover = index;
    };

    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = 1 - (event.clientY / window.innerHeight) * 2;
      window.__writingPointer = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };
    };

    document.addEventListener('mouseover', syncActive);
    document.addEventListener('focusin', syncActive);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      document.removeEventListener('mouseover', syncActive);
      document.removeEventListener('focusin', syncActive);
      document.removeEventListener('pointermove', onPointerMove);
      window.__writingActive = -1;
      window.__writingHover = -1;
    };
  }, [count]);

  return (
    <div className="writing-layout" ref={rootRef}>
      {children}
    </div>
  );
}

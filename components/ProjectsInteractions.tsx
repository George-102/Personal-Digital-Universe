'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  count: number;
  children: ReactNode;
};

declare global {
  interface Window {
    /** 当前悬停/聚焦的项目索引（-1 表示无）；3D 视觉层只读此探针，不触发 React 渲染 */
    __projectsActive?: number;
    /** 指针 NDC 方向，事件驱动写入，供 3D 光照方向表面反馈读取 */
    __projectsPointer?: { x: number; y: number };
    /** 3D 层 hover 探针：事件驱动写入，离屏暂停时仍准确 */
    __projectsHover?: number;
  }
}

/**
 * US-012f：内联展开面板的交互层。
 * 卡片本体是服务端渲染的静态 HTML，这里只挂一层事件委托：
 * 互斥展开、Esc 收起、焦点留在 summary、hover/focus 写入 3D 探针。
 * 不给 9 张卡片逐一绑定 React 合成事件（US-008k hydration 瘦身教训）。
 */
export default function ProjectsInteractions({ count, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-project-item]'));
    if (window.__projectsActive === undefined) window.__projectsActive = -1;

    const indexOf = (target: EventTarget | null) => {
      const item =
        target instanceof Element ? target.closest<HTMLElement>('[data-project-item]') : null;
      return item && root.contains(item) ? cards.indexOf(item) : -1;
    };

    const syncActive = (event: Event) => {
      const index = indexOf(event.target);
      cards.forEach((card, i) => {
        const value = i === index ? 'true' : 'false';
        if (card.dataset.active !== value) card.dataset.active = value;
      });
      if (window.__projectsActive !== index) window.__projectsActive = index;
      // 探针由事件驱动写入：3D 层离屏暂停（frameloop=never）时状态仍准确
      if (window.__projectsHover !== index) window.__projectsHover = index;
    };

    // toggle 不冒泡，必须 capture；程序化关闭也会派发，用于同步 data-open
    const onToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !root.contains(details)) return;
      if (details.open) {
        for (const other of root.querySelectorAll<HTMLDetailsElement>('details[open]')) {
          if (other !== details) other.open = false;
        }
      }
      const card = details.closest<HTMLElement>('[data-project-item]');
      if (card) card.dataset.open = details.open ? 'true' : 'false';
    };

    // 指针方向只写全局变量，不触发 React 状态；3D 场景 useFrame 只读
    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = 1 - (event.clientY / window.innerHeight) * 2;
      window.__projectsPointer = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const opened = root.querySelector<HTMLDetailsElement>('details[open]');
      if (!opened) return;
      opened.open = false;
      opened.querySelector('summary')?.focus();
    };

    document.addEventListener('mouseover', syncActive);
    document.addEventListener('focusin', syncActive);
    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      document.removeEventListener('mouseover', syncActive);
      document.removeEventListener('focusin', syncActive);
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointermove', onPointerMove);
      window.__projectsActive = -1;
    };
  }, [count]);

  return (
    <div className="projects-layout" ref={rootRef}>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

declare global {
  interface Window {
    /** 当前悬停/聚焦的技能索引（-1 表示无）；3D 星图只读此探针 */
    __skillsActive?: number;
    /** 3D 层 hover 探针：事件驱动写入，离屏暂停时仍准确 */
    __skillsHover?: number;
    /** 当前悬停技能所属领域（kebab），供 3D 聚簇高亮 */
    __skillsCategory?: string;
  }
}

/**
 * US-007e：技能卡片的交互层。
 * 卡片是服务端渲染的静态 HTML，这里只挂一层事件委托：
 * 互斥展开、Esc 收起、焦点留在 summary、hover/focus 写入 3D 探针。
 * 不给每张卡片逐一绑定 React 合成事件（US-008k hydration 瘦身教训）。
 */
export default function SkillsInteractions({ count, children }: { count: number; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-skill-item]'));
    if (window.__skillsActive === undefined) window.__skillsActive = -1;

    const indexOf = (target: EventTarget | null) => {
      const item =
        target instanceof Element ? target.closest<HTMLElement>('[data-skill-item]') : null;
      return item && root.contains(item) ? cards.indexOf(item) : -1;
    };

    const syncActive = (event: Event) => {
      const index = indexOf(event.target);
      cards.forEach((card, i) => {
        const value = i === index ? 'true' : 'false';
        if (card.dataset.active !== value) card.dataset.active = value;
      });
      if (window.__skillsActive !== index) window.__skillsActive = index;
      // 事件驱动写入：3D 层离屏暂停（frameloop=never）时状态仍准确
      if (window.__skillsHover !== index) window.__skillsHover = index;
      const category = index >= 0 ? (cards[index].dataset.skillCategory ?? '') : '';
      if (window.__skillsCategory !== category) window.__skillsCategory = category;
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
      const card = details.closest<HTMLElement>('[data-skill-item]');
      if (card) card.dataset.open = details.open ? 'true' : 'false';
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
    return () => {
      document.removeEventListener('mouseover', syncActive);
      document.removeEventListener('focusin', syncActive);
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('keydown', onKeyDown);
      window.__skillsActive = -1;
      window.__skillsHover = -1;
      window.__skillsCategory = '';
    };
  }, [count]);

  return (
    <div className="skills-layout" ref={rootRef}>
      {children}
    </div>
  );
}

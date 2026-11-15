'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import JourneyCanvas from '@/components/JourneyCanvas';

type Props = {
  count: number;
  /** 服务端渲染好的时间线静态 HTML（不参与 hydration 的交互逻辑） */
  children: ReactNode;
};

/**
 * US-008e：DOM 时间轴 ↔ 3D 轨道联动。
 *
 * 时间线本体作为服务端组件的 children 传入，这里是唯一的客户端边界：
 * 只挂载一个事件委托，不给 7 条卡片逐一绑定 React 合成事件、不复制它们到
 * 客户端组件树里（2026-11-15 云端 TBT 回归后做的 hydration 瘦身）。
 * 所有 dataset 写入只在真实交互时发生，绝不在渲染帧里写。
 */
export default function JourneyExperience({ count, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = rootRef.current?.querySelector<HTMLElement>('.journey-list');
    if (!list) return;
    const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-journey-item]'));

    const itemOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-journey-item]') : null;

    const syncActive = (item: HTMLElement | null) => {
      const index = item && list.contains(item) ? cards.indexOf(item) : -1;
      cards.forEach((card, i) => {
        const next = i === index ? 'true' : 'false';
        if (card.dataset.active !== next) card.dataset.active = next;
      });
      setActiveIndex(index >= 0 ? index : null);
    };

    // mouseover / focusin 会冒泡到 document；移到列表外时同样触发，用于清空高亮
    const onPointer = (event: Event) => syncActive(itemOf(event.target));

    // toggle 不冒泡，必须走 capture；程序化关闭其它 details 也会派发，正好同步 data-open
    const onToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !list.contains(details)) return;
      if (details.open) {
        for (const other of list.querySelectorAll<HTMLDetailsElement>('details[open]')) {
          if (other !== details) other.open = false;
        }
      }
      const card = details.closest<HTMLElement>('[data-journey-item]');
      if (card) card.dataset.open = details.open ? 'true' : 'false';
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const opened = list.querySelector<HTMLDetailsElement>('details[open]');
      if (!opened) return;
      opened.open = false;
      opened.querySelector('summary')?.focus();
    };

    document.addEventListener('mouseover', onPointer);
    document.addEventListener('focusin', onPointer);
    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mouseover', onPointer);
      document.removeEventListener('focusin', onPointer);
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="journey-layout" ref={rootRef}>
      {children}
      <JourneyCanvas count={count} activeIndex={activeIndex} />
    </div>
  );
}

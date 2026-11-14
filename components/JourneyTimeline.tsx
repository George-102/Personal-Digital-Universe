'use client';

import { useCallback, useState } from 'react';
import type { JourneyItemView } from '@/lib/journey';

type CategoryLabels = Record<JourneyItemView['category'], string>;

export type JourneyLabels = {
  listLabel: string;
  expand: string;
  collapse: string;
  noDetail: string;
  linkLabel: string;
  categories: CategoryLabels;
};

type Props = {
  items: JourneyItemView[];
  labels: JourneyLabels;
  /** US-008e：当前 hover/focus 的条目下标，用于高亮 3D 轨道上对应节点 */
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
};

/**
 * US-008c/f：DOM 时间轴是信息主体（3D 只是视觉层）。
 * - 用原生 <details>：无 JS 也能展开详情，SEO 抓得到全文；
 * - 有 detail 的条目才渲染折叠控件，无 detail 的条目直接展示摘要（验收 5）；
 * - 互斥展开 + Esc 收起，焦点留在 summary 上。
 */
export default function JourneyTimeline({
  items,
  labels,
  activeIndex,
  onActiveChange,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string, open: boolean) => {
    if (open) {
      setOpenId(id);
      return;
    }
    // 互斥关闭时本组件会程序化关闭其它 details，那也会派发 toggle；
    // 只有「当前展开项自己被关掉」才清空，否则刚打开的项会被误关。
    setOpenId((current) => (current === id ? null : current));
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLOListElement>) => {
    if (event.key !== 'Escape') return;
    setOpenId(null);
  }, []);

  return (
    <ol className="journey-list" aria-label={labels.listLabel} onKeyDown={handleKeyDown}>
      {items.map((item, index) => {
        const hasDetail = item.detail.length > 0;
        const isOpen = openId === item.id;
        const panelId = `${item.id}-panel`;
        const heading = (
          <>
            <span className="journey-meta">
              <span className="journey-period" data-journey-period>
                {item.period}
              </span>
              <span className="journey-chip" data-journey-category={item.category}>
                {labels.categories[item.category]}
              </span>
            </span>
            <h3 className="journey-title" data-journey-title>
              {item.title}
            </h3>
            <span className="journey-summary" data-journey-summary>
              {item.summary}
            </span>
          </>
        );

        return (
          <li
            key={item.id}
            className="journey-item"
            data-journey-item
            data-category={item.category}
            data-has-detail={hasDetail ? 'true' : 'false'}
            data-open={isOpen ? 'true' : 'false'}
            data-active={activeIndex === index ? 'true' : 'false'}
            onMouseEnter={() => onActiveChange(index)}
            onMouseLeave={() => onActiveChange(null)}
            onFocus={() => onActiveChange(index)}
            onBlur={() => onActiveChange(null)}
          >
            <span className="journey-marker" aria-hidden="true" />
            <div className="journey-card">
              {hasDetail ? (
                <details
                  className="journey-details"
                  open={isOpen}
                  onToggle={(event) => handleToggle(item.id, event.currentTarget.open)}
                >
                  <summary className="journey-summary-row">
                    {heading}
                    <span className="journey-toggle-hint" aria-hidden="true">
                      {isOpen ? labels.collapse : labels.expand}
                    </span>
                  </summary>
                  <div className="journey-panel" id={panelId} data-journey-panel>
                    {item.detail.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                    {item.link ? (
                      <a className="journey-link" href={item.link} data-journey-link>
                        {labels.linkLabel}
                      </a>
                    ) : null}
                  </div>
                </details>
              ) : (
                <div className="journey-static">
                  {heading}
                  <span className="journey-toggle-hint is-muted" data-journey-nodetail>
                    {labels.noDetail}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

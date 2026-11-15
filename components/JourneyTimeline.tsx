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
};

/**
 * US-008c/f：DOM 时间轴是信息主体（3D 只是视觉层）。
 *
 * 这是服务端组件：7 条卡片全部是静态 HTML，无 JS / 无 hydration，
 * 原生 <details> 保证无 JS 也能展开详情、SEO 抓得到全文。
 * 互斥展开、Esc 收起、hover/focus 联动由 JourneyExperience 的事件委托负责。
 */
export default function JourneyTimeline({ items, labels }: Props) {
  return (
    <ol className="journey-list" aria-label={labels.listLabel}>
      {items.map((item) => {
        const hasDetail = item.detail.length > 0;
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
            data-open="false"
            data-active="false"
          >
            <span className="journey-marker" aria-hidden="true" />
            <div className="journey-card">
              {hasDetail ? (
                <details className="journey-details">
                  <summary className="journey-summary-row">
                    {heading}
                    <span className="journey-toggle-hint" aria-hidden="true">
                      <span className="hint-expand">{labels.expand}</span>
                      <span className="hint-collapse">{labels.collapse}</span>
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

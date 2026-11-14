'use client';

import { useCallback, useState } from 'react';
import JourneyTimeline, { type JourneyLabels } from '@/components/JourneyTimeline';
import JourneyCanvas from '@/components/JourneyCanvas';
import type { JourneyItemView } from '@/lib/journey';

type Props = {
  items: JourneyItemView[];
  labels: JourneyLabels;
};

/**
 * US-008e：把 DOM 时间轴与 3D 轨道放在同一个客户端边界里，
 * 用 activeIndex 做单向联动（DOM → 3D），3D 不接受指针事件、也不反向写 DOM 文本。
 */
export default function JourneyExperience({ items, labels }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const handleActiveChange = useCallback((index: number | null) => setActiveIndex(index), []);

  return (
    <div className="journey-layout">
      <JourneyTimeline
        items={items}
        labels={labels}
        activeIndex={activeIndex}
        onActiveChange={handleActiveChange}
      />
      <JourneyCanvas count={items.length} activeIndex={activeIndex} />
    </div>
  );
}

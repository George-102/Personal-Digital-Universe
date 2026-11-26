'use client';

import { useEffect } from 'react';
import { attachScrollDriver, sharedScrollState, type ScrollDriverHandle } from '@/lib/scroll';

/**
 * 滚动进度驱动：监听原生滚动并把 hero→#about 段进度与整页进度写入共享进度源，
 * 同时维护当前模块视觉状态。不渲染可见内容；卸载时清理监听、RAF、ResizeObserver 与订阅。
 */
export default function ScrollDriver() {
  useEffect(() => {
    const handle: ScrollDriverHandle | null = attachScrollDriver({ state: sharedScrollState });
    return () => {
      handle?.destroy();
    };
  }, []);

  return null;
}

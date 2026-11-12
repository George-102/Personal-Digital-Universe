'use client';

import { useEffect } from 'react';
import { attachScrollDriver, sharedScrollState, type ScrollDriverHandle } from '@/lib/scroll';

/**
 * 转场进度驱动：监听原生滚动并把 hero→#about 进度写入共享进度源。
 * 渲染任何可见内容；卸载时清理监听、RAF 与订阅。
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

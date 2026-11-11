'use client';

import { useEffect } from 'react';
import { attachScrollDriver, sharedScrollState, type ScrollDriverHandle } from '@/lib/scroll';

/**
 * 转场进度驱动：挂载 GSAP ScrollTrigger 并把 hero→#about 进度写入共享进度源。
 * 渲染任何可见内容；卸载时清理 ScrollTrigger、ticker 与订阅。
 * GSAP 加载失败时静默回退静态页面，内容不受影响。
 */
export default function ScrollDriver() {
  useEffect(() => {
    let handle: ScrollDriverHandle | null = null;
    let cancelled = false;
    void attachScrollDriver({ state: sharedScrollState }).then((created) => {
      if (cancelled) created?.destroy();
      else handle = created;
    });
    return () => {
      cancelled = true;
      handle?.destroy();
      handle = null;
    };
  }, []);

  return null;
}

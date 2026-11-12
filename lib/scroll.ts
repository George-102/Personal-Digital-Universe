import { clamp, damp } from './pointer.ts';

export type ScrollSnapshot = {
  /** damp 平滑后的段进度，0~1，所有转场消费者读同一值 */
  progress: number;
  /** 滚动即时归一化值，0~1 */
  raw: number;
};

export type ScrollListener = (snapshot: ScrollSnapshot) => void;

export type ScrollStateOptions = {
  /** 平滑速率，越大越贴合滚动；与帧率无关 */
  lambda?: number;
  reducedMotion?: boolean;
};

/** 把任意滚动位置映射为 0~1 段进度；非法输入返回 0，退化区间不除零 */
export function normalizeProgress(value: number, start: number, end: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(start) || !Number.isFinite(end)) return 0;
  if (end <= start) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start), 0, 1);
}

/**
 * 单一滚动进度源：raw 为滚动即时值，progress 为 damp 平滑值。
 * 相机/背景/面板等所有转场消费者订阅同一状态，快速滚动时不会出现相互冲突的动画状态。
 */
export class ScrollState {
  private raw = 0;
  private progress = 0;
  private lambda: number;
  private reducedMotion: boolean;
  private listeners = new Set<ScrollListener>();
  private destroyed = false;

  constructor(options: ScrollStateOptions = {}) {
    const lambda = options.lambda;
    this.lambda = Number.isFinite(lambda as number) && (lambda as number) >= 0 ? (lambda as number) : 6;
    this.reducedMotion = options.reducedMotion === true;
  }

  setRaw(raw: number): void {
    if (this.destroyed || !Number.isFinite(raw)) return;
    const next = clamp(raw, 0, 1);
    if (next === this.raw) return;
    this.raw = next;
    if (this.reducedMotion) this.progress = next;
    this.notify();
  }

  /** 减少动态效果：简化为进度瞬时跟随滚动，不做平滑过渡 */
  setReducedMotion(reduced: boolean): void {
    if (this.destroyed) return;
    const next = reduced === true;
    if (next === this.reducedMotion) return;
    this.reducedMotion = next;
    if (next) this.progress = this.raw;
    this.notify();
  }

  /** 由渲染循环每帧驱动的平滑；reducedMotion 时瞬时贴合 */
  advance(delta: number): void {
    if (this.destroyed) return;
    const next = this.reducedMotion ? this.raw : damp(this.progress, this.raw, this.lambda, delta);
    if (next === this.progress) return;
    this.progress = next;
    this.notify();
  }

  getSnapshot(): ScrollSnapshot {
    return { progress: this.progress, raw: this.raw };
  }

  subscribe(listener: ScrollListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

/** 全站唯一的进度源单例：ScrollDriver 写入，HeroScene / 背景 / 面板只读 */
export const sharedScrollState = new ScrollState();

export type ScrollDriverHandle = { destroy: () => void };

export type ScrollDriverOptions = {
  state?: ScrollState;
  /** 段终点锚点（进度 1 时到达其顶部），默认 #about */
  targetSelector?: string;
};

/**
 * 滚动进度驱动绑定层：用原生 scroll + requestAnimationFrame 将 targetSelector
 * 的滚动区间归一化后写入进度源，并在 <html> 上同步 --scroll-progress 与
 * data-scroll-progress 供 CSS 与 E2E 消费。滚动始终是原生行为（不 preventDefault）。
 * 绑定异常时回退静态（返回 null），内容不受影响。
 */
export function attachScrollDriver(
  options: ScrollDriverOptions = {},
): ScrollDriverHandle | null {
  const state = options.state ?? sharedScrollState;
  const selector = options.targetSelector ?? '#about';

  const target = document.querySelector(selector);
  if (!target) return null;

  const root = document.documentElement;
  const writeDom = (snapshot: { progress: number }) => {
    const value = snapshot.progress.toFixed(4);
    if (root.dataset.scrollProgress === value) return;
    root.dataset.scrollProgress = value;
    root.style.setProperty('--scroll-progress', value);
  };

  // 段区间：target 顶部从视口底进入（0）到抵达视口顶（1）；
  // 页面过短滚不到视口顶时，终点 clamp 到实际可达的最大滚动位置
  const range = () => {
    const top = target.getBoundingClientRect().top + window.scrollY;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const start = Math.max(0, top - window.innerHeight);
    const end = Math.min(top, maxScroll);
    return { start, end: Math.max(start + 1, end) };
  };

  const updateProgress = () => {
    const { start, end } = range();
    state.setRaw(normalizeProgress(window.scrollY, start, end));
  };

  // passive scroll：不阻塞滚动性能
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });

  const unsubscribe = state.subscribe(writeDom);
  writeDom(state.getSnapshot());

  // RAF 驱动 damp 平滑（替代 gsap.ticker）
  let rafId: number;
  let lastTime = performance.now();
  const tick = () => {
    const now = performance.now();
    state.advance(Math.max(0, now - lastTime) / 1000);
    lastTime = now;
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => state.setReducedMotion(motionQuery.matches);
  syncMotion();
  motionQuery.addEventListener('change', syncMotion);

  return {
    destroy: () => {
      motionQuery.removeEventListener('change', syncMotion);
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      unsubscribe();
      state.setRaw(0);
      root.style.removeProperty('--scroll-progress');
      delete root.dataset.scrollProgress;
    },
  };
}

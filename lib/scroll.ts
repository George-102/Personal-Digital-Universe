import { useSyncExternalStore } from 'react';
import { clamp, damp } from './pointer.ts';
import { navItems, navTargetId } from './nav.ts';
import {
  activeSectionAt,
  sectionFromPathname,
  sectionVisuals,
  type SectionPosition,
} from './section-state.ts';

export type ScrollSnapshot = {
  /** damp 平滑后的段进度，0~1，所有转场消费者读同一值 */
  progress: number;
  /** 滚动即时归一化值，0~1 */
  raw: number;
  /** 整页浏览进度：0=页面顶，1=页面底；不做平滑，保证快速滚动不延迟 */
  overall: number;
  /** 当前模块 id，来自导航注册表 */
  activeSection: string;
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
export type ScrollUpdate = Partial<Pick<ScrollSnapshot, 'raw' | 'overall' | 'activeSection'>>;

export class ScrollState {
  private raw = 0;
  private progress = 0;
  private overall = 0;
  private activeSection = sectionVisuals[0]?.id ?? 'home';
  private lambda: number;
  private reducedMotion: boolean;
  private listeners = new Set<ScrollListener>();
  private destroyed = false;

  constructor(options: ScrollStateOptions = {}) {
    const lambda = options.lambda;
    this.lambda = Number.isFinite(lambda as number) && (lambda as number) >= 0 ? (lambda as number) : 6;
    this.reducedMotion = options.reducedMotion === true;
  }

  /** 一次滚动事件批量写入，去重后只通知一次，避免同一帧多次 DOM 写入 */
  applyScroll(update: ScrollUpdate): void {
    if (this.destroyed) return;
    let changed = false;
    if (Number.isFinite(update.raw)) {
      const next = clamp(update.raw as number, 0, 1);
      if (next !== this.raw) {
        this.raw = next;
        changed = true;
      }
    }
    if (Number.isFinite(update.overall)) {
      const next = clamp(update.overall as number, 0, 1);
      if (next !== this.overall) {
        this.overall = next;
        changed = true;
      }
    }
    if (
      typeof update.activeSection === 'string' &&
      update.activeSection !== this.activeSection
    ) {
      this.activeSection = update.activeSection;
      changed = true;
    }
    if (!changed) return;
    if (this.reducedMotion) this.progress = this.raw;
    this.notify();
  }

  setRaw(raw: number): void {
    this.applyScroll({ raw });
  }

  setOverall(overall: number): void {
    this.applyScroll({ overall });
  }

  setActiveSection(id: string): void {
    this.applyScroll({ activeSection: id });
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
    return {
      progress: this.progress,
      raw: this.raw,
      overall: this.overall,
      activeSection: this.activeSection,
    };
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
 * 滚动进度驱动绑定层：用原生 scroll + requestAnimationFrame 把 hero→#about 段进度
 * 与整页进度写入同一个状态源；几何信息用 ResizeObserver 缓存，滚动事件只读缓存，
 * 不在每帧读布局。滚动始终是原生行为（不 preventDefault），绑定异常时回退静态。
 *
 * --scroll-progress / data-scroll-progress 继续供 US-003 转场消费；
 * --page-progress / data-page-progress / data-active-section 供 US-005 指示器与模块状态消费。
 */
export function attachScrollDriver(
  options: ScrollDriverOptions = {},
): ScrollDriverHandle | null {
  try {
    const state = options.state ?? sharedScrollState;
    const selector = options.targetSelector ?? '#about';
    const target = document.querySelector(selector);
    const root = document.documentElement;
    const body = document.body;
    const sectionElements = new Map<string, HTMLElement>();
    for (const item of navItems) {
      const id = navTargetId(item);
      if (!id) continue;
      const element = document.getElementById(id);
      if (element) sectionElements.set(id, element);
    }

    let maxScroll = 0;
    let viewportHeight = window.innerHeight;
    let targetTop = 0;
    let sectionPositions: SectionPosition[] = [];
    let lastActive = '';
    let lastProgress = '';
    let lastOverall = '';

    const measure = () => {
      viewportHeight = window.innerHeight;
      maxScroll = Math.max(0, root.scrollHeight - viewportHeight);
      targetTop = target ? target.getBoundingClientRect().top + window.scrollY : 0;
      sectionPositions = Array.from(sectionElements, ([id, element]) => ({
        id,
        top: element.getBoundingClientRect().top + window.scrollY,
      }));
      updateProgress();
    };

    // 段区间：target 顶部从视口底进入（0）到抵达视口顶（1）；
    // 页面过短滚不到视口顶时，终点 clamp 到实际可达的最大滚动位置
    const segmentRange = () => {
      const start = Math.max(0, targetTop - viewportHeight);
      const end = Math.min(targetTop, maxScroll);
      return { start, end: Math.max(start + 1, end) };
    };

    const writeDom = (snapshot: ScrollSnapshot) => {
      const progress = snapshot.progress.toFixed(4);
      if (progress !== lastProgress) {
        lastProgress = progress;
        root.dataset.scrollProgress = progress;
        root.style.setProperty('--scroll-progress', progress);
      }
      const overall = snapshot.overall.toFixed(4);
      if (overall !== lastOverall) {
        lastOverall = overall;
        root.dataset.pageProgress = overall;
        root.style.setProperty('--page-progress', overall);
      }
      if (snapshot.activeSection !== lastActive) {
        lastActive = snapshot.activeSection;
        root.dataset.activeSection = snapshot.activeSection;
        const visual = sectionVisuals.find((item) => item.id === snapshot.activeSection);
        if (visual) {
          root.style.setProperty('--section-accent', visual.accent);
          root.style.setProperty('--section-glow', visual.glow);
          root.style.setProperty('--section-particle', visual.particle);
        }
        for (const [id, element] of sectionElements) {
          if (id === snapshot.activeSection) element.dataset.sectionActive = 'true';
          else delete element.dataset.sectionActive;
        }
      }
    };

    const updateProgress = () => {
      const scrollY = window.scrollY;
      const { start, end } = segmentRange();
      const raw = target ? normalizeProgress(scrollY, start, end) : 0;
      const overall = maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0;
      const activeSection = sectionPositions.length
        ? activeSectionAt(sectionPositions, scrollY, viewportHeight, maxScroll)
        : sectionFromPathname(window.location.pathname);
      state.applyScroll({ raw, overall, activeSection });
    };

    measure();

    // passive scroll：只读窗口滚动值与缓存几何；resize / 内容变化才重新测量布局
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(body);

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
        observer.disconnect();
        window.removeEventListener('scroll', updateProgress);
        window.removeEventListener('resize', measure);
        unsubscribe();
        state.setRaw(0);
        root.style.removeProperty('--scroll-progress');
        delete root.dataset.scrollProgress;
        root.style.removeProperty('--page-progress');
        delete root.dataset.pageProgress;
        delete root.dataset.activeSection;
        for (const element of sectionElements.values()) delete element.dataset.sectionActive;
      },
    };
  } catch {
    // 绑定异常时回退静态（返回 null），内容仍可读可滚动
    return null;
  }
}

const subscribeShared = (listener: () => void) => sharedScrollState.subscribe(listener);
const getActiveSection = () => sharedScrollState.getSnapshot().activeSection;
const getServerActiveSection = () => sectionVisuals[0]?.id ?? 'home';

/** 供已挂载的 3D 场景读取当前模块；只在状态变化时触发 React 更新，不在 useFrame 内调用 */
export function useActiveSection(): string {
  return useSyncExternalStore(subscribeShared, getActiveSection, getServerActiveSection);
}

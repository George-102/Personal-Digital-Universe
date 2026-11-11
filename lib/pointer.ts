export type Vec2 = { x: number; y: number };
export type RectLike = { left: number; top: number; width: number; height: number };

export type PointerEventLike = {
  clientX: number;
  clientY: number;
  pointerId: number;
  isPrimary?: boolean;
  pointerType?: string;
  timeStamp?: number;
};

export type PointerSnapshot = {
  /** 归一化设备坐标，-1~1，y 轴朝上 */
  ndc: Vec2;
  client: Vec2;
  /** 限幅后的像素增量，供场景做防抖 */
  delta: Vec2;
  active: boolean;
  dragging: boolean;
  pointerId: number | null;
  /** 本次按下后的累计位移（像素），用于区分点击与拖拽 */
  travel: number;
  downTime: number | null;
};

export type Gesture = {
  type: 'down' | 'up' | 'cancel' | 'leave';
  travel: number;
  durationMs: number;
  snapshot: PointerSnapshot;
};

export type PointerEventType =
  | 'pointermove'
  | 'pointerdown'
  | 'pointerup'
  | 'pointercancel'
  | 'pointerleave'
  | 'blur';

export type PointerOptions = {
  /** 单帧允许的最大指针增量（像素），用于快速移动防抖 */
  maxStep?: number;
  onGesture?: (gesture: Gesture) => void;
  /** 每次指针移动后触发，供拖拽旋转消费限幅后的增量 */
  onMove?: (snapshot: PointerSnapshot, event: PointerEventLike) => void;
};

export type PointerTracker = {
  getSnapshot: () => PointerSnapshot;
  destroy: () => void;
};

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

export function toNDC(clientX: number, clientY: number, rect: RectLike): Vec2 {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return { x: 0, y: 0 };
  if (!(rect.width > 0) || !(rect.height > 0)) return { x: 0, y: 0 };
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
    y: clamp(1 - ((clientY - rect.top) / rect.height) * 2, -1, 1),
  };
}

/** 与帧率无关的指数平滑；目标非法时保持当前值，避免 NaN 污染动画状态 */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  if (!Number.isFinite(target)) return current;
  if (!Number.isFinite(current)) return target;
  const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;
  const rate = Number.isFinite(lambda) ? Math.max(0, lambda) : 0;
  return current + (target - current) * (1 - Math.exp(-rate * step));
}

export function limitDelta(dx: number, dy: number, maxStep: number): Vec2 {
  const x = Number.isFinite(dx) ? dx : 0;
  const y = Number.isFinite(dy) ? dy : 0;
  const length = Math.hypot(x, y);
  if (length === 0 || length <= maxStep) return { x, y };
  const scale = maxStep / length;
  return { x: x * scale, y: y * scale };
}

/** 粒子排斥力：半径外为 0，半径内按平方衰减，最大不超过 strength */
export function repelFactor(distance: number, radius: number, strength: number): number {
  if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0 || distance < 0) return 0;
  if (distance >= radius) return 0;
  const t = 1 - distance / radius;
  const max = Number.isFinite(strength) ? Math.max(0, strength) : 0;
  return clamp(max * t * t, 0, max);
}

/** 位移与时长都在阈值内才算点击；明显拖拽或长按不触发跳转 */
export function isClickGesture(travel: number, durationMs: number, maxTravel = 6, maxDuration = 800): boolean {
  return (
    Number.isFinite(travel) &&
    Number.isFinite(durationMs) &&
    travel <= maxTravel &&
    durationMs <= maxDuration
  );
}

function emptySnapshot(): PointerSnapshot {
  return {
    ndc: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    active: false,
    dragging: false,
    pointerId: null,
    travel: 0,
    downTime: null,
  };
}

/**
 * 纯指针状态机：鼠标与触摸统一为一套输入，只跟踪主指针。
 * 不直接触发 React 更新——场景在 useFrame 中读取快照，天然每帧最多消费一次。
 */
export class PointerState {
  private rect: () => RectLike;
  private maxStep: number;
  private onGesture?: (gesture: Gesture) => void;
  private onMove?: (snapshot: PointerSnapshot, event: PointerEventLike) => void;
  private state: PointerSnapshot = emptySnapshot();

  constructor(getRect: () => RectLike, options: PointerOptions = {}) {
    this.rect = getRect;
    this.maxStep = options.maxStep ?? 8;
    this.onGesture = options.onGesture;
    this.onMove = options.onMove;
  }

  getSnapshot(): PointerSnapshot {
    return {
      ndc: { ...this.state.ndc },
      client: { ...this.state.client },
      delta: { ...this.state.delta },
      active: this.state.active,
      dragging: this.state.dragging,
      pointerId: this.state.pointerId,
      travel: this.state.travel,
      downTime: this.state.downTime,
    };
  }

  handle(type: PointerEventType, event: PointerEventLike): void {
    const id = Number.isFinite(event.pointerId) ? event.pointerId : 0;
    const time = Number.isFinite(event.timeStamp) ? (event.timeStamp as number) : 0;
    const isPrimary = event.isPrimary !== false;

    if (type === 'pointerdown') {
      if (this.state.pointerId !== null) return;
      this.state.pointerId = id;
      this.state.dragging = true;
      this.state.active = true;
      this.state.travel = 0;
      this.state.downTime = time;
      this.updatePosition(event, true);
      this.emit('down', 0, 0);
      return;
    }

    if (type === 'pointermove') {
      if (this.state.pointerId !== null && id !== this.state.pointerId) return;
      if (this.state.pointerId === null && !isPrimary) return;
      this.updatePosition(event, false);
      this.onMove?.(this.getSnapshot(), event);
      return;
    }

    if (type === 'pointerup' || type === 'pointercancel') {
      if (this.state.pointerId !== null && id !== this.state.pointerId) return;
      const duration =
        this.state.downTime === null ? 0 : Math.max(0, time - this.state.downTime);
      this.state.dragging = false;
      this.state.pointerId = null;
      this.emit(type === 'pointerup' ? 'up' : 'cancel', this.state.travel, duration);
      return;
    }

    // pointerleave / blur：目标回中由场景的 damp 平滑完成，这里只清状态
    this.state.active = false;
    this.state.dragging = false;
    this.state.pointerId = null;
    this.state.downTime = null;
    this.state.ndc = { x: 0, y: 0 };
    this.state.delta = { x: 0, y: 0 };
    this.emit('leave', this.state.travel, 0);
  }

  private updatePosition(event: PointerEventLike, reset: boolean): void {
    const rawDx = event.clientX - this.state.client.x;
    const rawDy = event.clientY - this.state.client.y;
    this.state.client = { x: event.clientX, y: event.clientY };
    this.state.ndc = toNDC(event.clientX, event.clientY, this.rect());
    this.state.delta = reset ? { x: 0, y: 0 } : limitDelta(rawDx, rawDy, this.maxStep);
    this.state.active = true;
    if (!reset && this.state.dragging) {
      this.state.travel += Math.hypot(rawDx, rawDy);
    }
  }

  private emit(type: Gesture['type'], travel: number, durationMs: number): void {
    this.onGesture?.({ type, travel, durationMs, snapshot: this.getSnapshot() });
  }
}

/** DOM 绑定层：所有监听集中在 canvas 上，destroy 时全部移除 */
export function attachPointerTracker(el: HTMLElement, options: PointerOptions = {}): PointerTracker {
  const state = new PointerState(() => el.getBoundingClientRect(), options);
  const eventTypes: PointerEventType[] = [
    'pointermove',
    'pointerdown',
    'pointerup',
    'pointercancel',
    'pointerleave',
  ];
  const listeners = eventTypes.map((type) => {
    const handler = (event: Event) => state.handle(type, event as PointerEvent);
    el.addEventListener(type, handler, { passive: true });
    return { type, handler };
  });
  const onBlur = () =>
    state.handle('blur', {
      clientX: 0,
      clientY: 0,
      pointerId: 0,
      isPrimary: true,
      timeStamp: performance.now(),
    });
  window.addEventListener('blur', onBlur);

  return {
    getSnapshot: () => state.getSnapshot(),
    destroy: () => {
      for (const { type, handler } of listeners) el.removeEventListener(type, handler);
      window.removeEventListener('blur', onBlur);
    },
  };
}

import type { QualityTier } from './quality';

/** 每 30 帧结算一次平均帧时长；低于 ~42fps 视为慢窗口 */
export const FRAME_WINDOW = 30;
export const SLOW_FRAME_MS = 24;
/** 连续两个慢窗口才降档，避免短时抖动误判 */
export const DEGRADE_AFTER_SLOW_WINDOWS = 2;
/** 切后台 / 断点产生的异常帧间隔忽略 */
const MAX_VALID_FRAME_MS = 250;
const MIN_PARTICLES = 150;
const DEGRADED_PARTICLE_RATIO = 0.7;

export type AdaptiveState = {
  frames: number;
  elapsedMs: number;
  slowWindows: number;
  degraded: boolean;
};

export function createAdaptiveState(): AdaptiveState {
  return { frames: 0, elapsedMs: 0, slowWindows: 0, degraded: false };
}

/**
 * 纯函数：消费一帧间隔，返回最新采样状态。
 * 只读时间戳，不访问 DOM；降级后原样返回，不反复翻转。
 */
export function nextAdaptiveState(state: AdaptiveState, frameMs: number): AdaptiveState {
  if (state.degraded || frameMs <= 0 || frameMs > MAX_VALID_FRAME_MS) return state;

  const frames = state.frames + 1;
  const elapsedMs = state.elapsedMs + frameMs;
  if (frames < FRAME_WINDOW) return { ...state, frames, elapsedMs };

  const slowWindows = elapsedMs / FRAME_WINDOW > SLOW_FRAME_MS ? state.slowWindows + 1 : 0;
  return {
    frames: 0,
    elapsedMs: 0,
    slowWindows,
    degraded: slowWindows >= DEGRADE_AFTER_SLOW_WINDOWS,
  };
}

/** 运行时降档：只减粒子与 dpr，保留设备分类；不修改入参。 */
export function degradeTier(tier: QualityTier): QualityTier {
  return {
    ...tier,
    particles: Math.max(MIN_PARTICLES, Math.round(tier.particles * DEGRADED_PARTICLE_RATIO)),
    pixelRatio: Math.min(tier.pixelRatio, 1),
    reduced: true,
  };
}

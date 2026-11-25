export type DeviceClass = 'mobile' | 'tablet' | 'laptop' | 'desktop';

declare global {
  interface Window {
    /** 设备分类探针（E2E 只读，不写 dataset） */
    __deviceTier?: DeviceClass;
    /** 实际生效的画质档位（含运行时降档） */
    __qualityTier?: QualityTier;
  }
}

export type QualityTier = {
  particles: number;
  pixelRatio: number;
  deviceClass: DeviceClass;
  /** 硬件信号触发的降档标记；视口档位本身不算降档 */
  reduced: boolean;
};

export type DeviceSignals = {
  hardwareConcurrency?: number;
  deviceMemory?: number;
};

const BASE_TIERS: Record<DeviceClass, { particles: number; dprCap: number }> = {
  mobile: { particles: 350, dprCap: 1.5 },
  tablet: { particles: 500, dprCap: 1.5 },
  laptop: { particles: 700, dprCap: 1.5 },
  desktop: { particles: 700, dprCap: 1.5 },
};

const LOW_CONCURRENCY = 4;
const LOW_MEMORY = 4;
const REDUCED_PARTICLE_RATIO = 0.7;
const MIN_PARTICLES = 150;

/** 纯函数：视口宽度 → 设备档位。边界归高一档（640 平板、1024 笔记本、1280 桌面）。 */
export function getDeviceClass(width: number): DeviceClass {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'laptop';
  return 'desktop';
}

/**
 * 纯函数：设备档位 + 可选硬件信号 → 渲染画质。
 * 桌面/笔记本维持 US-010k 绿灯基线（700 粒子 / dpr≤1.5），平板主动简化。
 * 硬件信号缺失时按视口档位（浏览器未提供相关设置时的默认行为）。
 */
export function getQualityTier(
  width: number,
  devicePixelRatio: number,
  signals: DeviceSignals = {},
): QualityTier {
  const deviceClass = getDeviceClass(width);
  const base = BASE_TIERS[deviceClass];
  const lowPower =
    (signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= LOW_CONCURRENCY) ||
    (signals.deviceMemory !== undefined && signals.deviceMemory <= LOW_MEMORY);

  const particles = lowPower
    ? Math.max(MIN_PARTICLES, Math.round(base.particles * REDUCED_PARTICLE_RATIO))
    : base.particles;
  const pixelRatio = Math.min(devicePixelRatio || 1, lowPower ? 1 : base.dprCap);

  return { particles, pixelRatio, deviceClass, reduced: lowPower };
}

type NavigatorSignals = {
  hardwareConcurrency?: number;
  deviceMemory?: number;
};

/** 读取浏览器硬件信号；缺失或非数字时返回空对象，按视口档位处理。 */
export function readDeviceSignals(source?: NavigatorSignals | null): DeviceSignals {
  const nav =
    source === undefined
      ? typeof navigator === 'undefined'
        ? null
        : (navigator as NavigatorSignals)
      : source;
  if (!nav) return {};

  const signals: DeviceSignals = {};
  if (typeof nav.hardwareConcurrency === 'number' && Number.isFinite(nav.hardwareConcurrency)) {
    signals.hardwareConcurrency = nav.hardwareConcurrency;
  }
  if (typeof nav.deviceMemory === 'number' && Number.isFinite(nav.deviceMemory)) {
    signals.deviceMemory = nav.deviceMemory;
  }
  return signals;
}

/** 浏览器侧统一入口：视口 + 硬件信号 → 画质档位。 */
export function readViewportQuality(): QualityTier {
  return getQualityTier(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
    typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
    readDeviceSignals(),
  );
}

export type TransitionRange = {
  /** 段终点锚点选择器（进度 1 时该元素抵达滚动终点），如 #about */
  targetSelector: string;
  /** 触发区间裁剪 [from, to] ⊂ [0,1]，from < to，可在锚点滚动区间内截取子段 */
  from: number;
  to: number;
};

export type TransitionCamera = {
  /** 进度 1 时相机 z 偏移（世界单位，负为推进），|zOffset| ≤ 5 */
  zOffset: number;
  /** 进度 1 时核心物体附加旋转（弧度），|coreSpin| ≤ π */
  coreSpin: number;
  /** 进度 1 时核心物体 y 位移，|coreYOffset| ≤ 2 */
  coreYOffset: number;
};

export type TransitionBackground = {
  /** 段起点背景色，#rgb / #rrggbb */
  from: string;
  /** 段终点背景色，#rgb / #rrggbb */
  to: string;
};

export type TransitionParticles = {
  /** 进度 1 时粒子壳层半径系数：<1 聚集、>1 扩散，∈[0.2, 3] */
  shellScale: number;
};

export type TransitionPanel = {
  /** 展开时的初始上移距离（px），∈[0, 200] */
  risePx: number;
  /** 展开时的初始倾斜角度（deg），∈[0, 15] */
  tiltDeg: number;
  /** 面板文字透明度下限，∈[0.85, 1]（PRD 详述 6：进入视口的内容立即可读） */
  minOpacity: number;
};

/**
 * 转场段配置：效果参数与场景组件分离，走单一出口。
 * 后续模块（Journey / Research …）接入转场只需在这里新增一条配置。
 */
export type TransitionSegment = {
  id: string;
  range: TransitionRange;
  camera: TransitionCamera;
  background: TransitionBackground;
  particles: TransitionParticles;
  panel: TransitionPanel;
};

export type CameraTargets = { z: number; y: number; spin: number };

/** 把段进度线性映射为相机/物体目标偏移；进度越界 clamp，非法输入归零 */
export function cameraTargets(progress: number, camera: TransitionCamera): CameraTargets {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  if (p === 0) return { z: 0, y: 0, spin: 0 };
  return {
    z: camera.zOffset * p,
    y: camera.coreYOffset * p,
    spin: camera.coreSpin * p,
  };
}

/**
 * 粒子壳层系数：1 为原半径，<1 聚集、>1 扩散。
 * 进度越界 clamp；非法输入回 1（不变形）。
 */
export function shellFactor(progress: number, particles: TransitionParticles): number {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const scale = particles.shellScale;
  if (!Number.isFinite(scale)) return 1;
  return 1 + (scale - 1) * p;
}

export const transitionSegments: readonly TransitionSegment[] = [
  {
    id: 'hero-about',
    range: { targetSelector: '#about', from: 0, to: 1 },
    camera: { zOffset: -1.4, coreSpin: Math.PI / 2, coreYOffset: -0.3 },
    background: { from: '#0b1020', to: '#151d3a' },
    particles: { shellScale: 0.75 },
    panel: { risePx: 24, tiltDeg: 2.5, minOpacity: 0.9 },
  },
];

export function findTransitionSegment(
  segments: readonly TransitionSegment[],
  id: string | null | undefined,
): TransitionSegment | undefined {
  if (!id) return undefined;
  return segments.find((segment) => segment.id === id);
}

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SELECTOR = /^#[A-Za-z0-9_-]+$/;

function checkNumber(
  errors: string[],
  prefix: string,
  value: unknown,
  min: number,
  max: number,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    errors.push(`${prefix}: 越界系数 ${String(value)}（允许 ${min}~${max}）`);
  }
}

/** 返回错误信息数组，空数组表示通过。prebuild 调用后在构建期拒绝非法配置。 */
export function validateTransitionSegments(segments: readonly unknown[]): string[] {
  const errors: string[] = [];
  if (!Array.isArray(segments) || segments.length === 0) {
    return ['transitions: 注册表不能为空'];
  }
  const seen = new Set<string>();

  segments.forEach((raw, index) => {
    const prefix = `transitions[${index}]`;
    if (raw === null || typeof raw !== 'object') {
      errors.push(`${prefix}: 必须是对象`);
      return;
    }
    const segment = raw as Partial<TransitionSegment>;

    if (typeof segment.id !== 'string' || !segment.id.trim()) {
      errors.push(`${prefix}.id: 缺失`);
    } else if (seen.has(segment.id)) {
      errors.push(`${prefix}.id: 重复 ${segment.id}`);
    } else {
      seen.add(segment.id);
    }

    const range = segment.range as Partial<TransitionRange> | undefined;
    if (!range || typeof range !== 'object') {
      errors.push(`${prefix}.range: 缺失`);
    } else {
      if (typeof range.targetSelector !== 'string' || !SELECTOR.test(range.targetSelector)) {
        errors.push(`${prefix}.range.targetSelector: 非法值 ${String(range.targetSelector)}`);
      }
      const { from, to } = range;
      if (
        typeof from !== 'number' ||
        typeof to !== 'number' ||
        !Number.isFinite(from) ||
        !Number.isFinite(to) ||
        from < 0 ||
        to > 1 ||
        from >= to
      ) {
        errors.push(`${prefix}.range: 非法区间 [${String(from)}, ${String(to)}]`);
      }
    }

    const camera = segment.camera as Partial<TransitionCamera> | undefined;
    if (!camera || typeof camera !== 'object') {
      errors.push(`${prefix}.camera: 缺失`);
    } else {
      checkNumber(errors, `${prefix}.camera.zOffset`, camera.zOffset, -5, 5);
      checkNumber(errors, `${prefix}.camera.coreSpin`, camera.coreSpin, -Math.PI, Math.PI);
      checkNumber(errors, `${prefix}.camera.coreYOffset`, camera.coreYOffset, -2, 2);
    }

    const background = segment.background as Partial<TransitionBackground> | undefined;
    if (!background || typeof background !== 'object') {
      errors.push(`${prefix}.background: 缺失`);
    } else {
      for (const key of ['from', 'to'] as const) {
        if (typeof background[key] !== 'string' || !HEX_COLOR.test(background[key] as string)) {
          errors.push(`${prefix}.background.${key}: 非法颜色 ${String(background[key])}`);
        }
      }
    }

    const particles = segment.particles as Partial<TransitionParticles> | undefined;
    if (!particles || typeof particles !== 'object') {
      errors.push(`${prefix}.particles: 缺失`);
    } else {
      checkNumber(errors, `${prefix}.particles.shellScale`, particles.shellScale, 0.2, 3);
    }

    const panel = segment.panel as Partial<TransitionPanel> | undefined;
    if (!panel || typeof panel !== 'object') {
      errors.push(`${prefix}.panel: 缺失`);
    } else {
      checkNumber(errors, `${prefix}.panel.risePx`, panel.risePx, 0, 200);
      checkNumber(errors, `${prefix}.panel.tiltDeg`, panel.tiltDeg, 0, 15);
      checkNumber(errors, `${prefix}.panel.minOpacity`, panel.minOpacity, 0.85, 1);
    }
  });

  return errors;
}

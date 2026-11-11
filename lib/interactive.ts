export const HOVER_FEEDBACKS = ['glow', 'scale', 'spin', 'tooltip'] as const;
export type HoverFeedback = (typeof HOVER_FEEDBACKS)[number];

/**
 * 可交互物体注册表条目。场景组件只消费这份配置，
 * 新增物体或替换点击目标不需要改交互逻辑（后续 Research / Projects / Writing 场景共用）。
 */
export type InteractiveObject = {
  id: string;
  /** messages 中的文案键，如 Interaction.core */
  labelKey: string;
  hoverFeedback: readonly HoverFeedback[];
  draggable: boolean;
  /** 站内锚点，点击后平滑滚动，如 #about */
  clickTarget: string;
};

export const heroInteractiveObjects: readonly InteractiveObject[] = [
  {
    id: 'core',
    labelKey: 'Interaction.core',
    hoverFeedback: ['glow', 'scale', 'spin', 'tooltip'],
    draggable: true,
    clickTarget: '#about',
  },
  {
    id: 'orbit-node',
    labelKey: 'Interaction.orbitNode',
    hoverFeedback: ['glow', 'tooltip'],
    draggable: false,
    clickTarget: '#about',
  },
];

export function findInteractiveObject(
  objects: readonly InteractiveObject[],
  id: string | null | undefined,
): InteractiveObject | undefined {
  if (!id) return undefined;
  return objects.find((object) => object.id === id);
}

/** 返回错误信息数组，空数组表示通过。prebuild 调用后在构建期拒绝非法配置。 */
export function validateInteractiveObjects(objects: readonly unknown[]): string[] {
  const errors: string[] = [];
  if (!Array.isArray(objects) || objects.length === 0) {
    return ['interactive: 注册表不能为空'];
  }
  const seen = new Set<string>();

  objects.forEach((raw, index) => {
    const prefix = `interactive[${index}]`;
    if (raw === null || typeof raw !== 'object') {
      errors.push(`${prefix}: 必须是对象`);
      return;
    }
    const object = raw as Partial<InteractiveObject>;

    if (typeof object.id !== 'string' || !object.id.trim()) {
      errors.push(`${prefix}.id: 缺失`);
    } else if (seen.has(object.id)) {
      errors.push(`${prefix}.id: 重复 ${object.id}`);
    } else {
      seen.add(object.id);
    }

    if (
      typeof object.labelKey !== 'string' ||
      !/^[A-Za-z][A-Za-z0-9]*\.[A-Za-z0-9_]+$/.test(object.labelKey)
    ) {
      errors.push(`${prefix}.labelKey: 缺失或格式非法`);
    }

    if (
      typeof object.clickTarget !== 'string' ||
      !/^#[A-Za-z0-9_-]+$/.test(object.clickTarget)
    ) {
      errors.push(`${prefix}.clickTarget: 非法值 ${String(object.clickTarget)}`);
    }

    if (typeof object.draggable !== 'boolean') {
      errors.push(`${prefix}.draggable: 必须为 boolean`);
    }

    if (!Array.isArray(object.hoverFeedback)) {
      errors.push(`${prefix}.hoverFeedback: 必须为数组`);
    } else {
      for (const feedback of object.hoverFeedback) {
        if (!HOVER_FEEDBACKS.includes(feedback as HoverFeedback)) {
          errors.push(`${prefix}.hoverFeedback: 非法反馈 ${String(feedback)}`);
        }
      }
    }
  });

  return errors;
}

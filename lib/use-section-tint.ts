'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useActiveSection } from './scroll';
import { sectionVisualFor, type SectionVisual } from './section-state';

/**
 * 让已挂载的 3D 场景复用当前模块色调。
 * 状态变化时才触发 React 更新与一次 dataset 写入；useFrame 内零布局读写、零 setState。
 */
export function useSectionTint(): SectionVisual {
  const section = useActiveSection();
  const gl = useThree((state) => state.gl);
  const visual = sectionVisualFor(section);

  useEffect(() => {
    gl.domElement.dataset.sectionTint = visual.particle;
  }, [gl, visual.particle]);

  return visual;
}

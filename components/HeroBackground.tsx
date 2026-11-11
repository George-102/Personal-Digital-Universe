'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';
import { findTransitionSegment, transitionSegments } from '@/lib/transitions';

// 背景渐变色只从注册表读取（US-003b），组件内不硬编码
const heroSegment = findTransitionSegment(transitionSegments, 'hero-about');
const background = heroSegment?.background ?? { from: '#05060f', to: '#05060f' };

export default function HeroBackground() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  // 检测完成前与无 WebGL 时都渲染 CSS 背景；3D Canvas 在 US-001c 挂载于此层之上。
  // 渐变由 --scroll-progress（ScrollDriver 写在 <html>）驱动，无 JS 时回退 0 即静态背景
  return (
    <div
      className="hero-bg"
      aria-hidden="true"
      data-webgl={webgl === true ? '1' : '0'}
      style={
        {
          '--hero-bg-from': background.from,
          '--hero-bg-to': background.to,
        } as CSSProperties
      }
    >
      <div className="hero-bg-tint" />
    </div>
  );
}
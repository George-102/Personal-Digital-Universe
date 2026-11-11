'use client';

import { useEffect, useState } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';

export default function HeroBackground() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  // 检测完成前与无 WebGL 时都渲染 CSS 背景；3D Canvas 在 US-001c 挂载于此层之上
  return <div className="hero-bg" aria-hidden="true" data-webgl={webgl === true ? '1' : '0'} />;
}
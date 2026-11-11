type CanvasLike = {
  getContext: (type: string) => unknown;
};

export function detectWebGL(canvas: CanvasLike): boolean {
  try {
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  return detectWebGL(document.createElement('canvas'));
}
export type QualityTier = {
  particles: number;
  pixelRatio: number;
};

export function getQualityTier(width: number, devicePixelRatio: number): QualityTier {
  if (width < 640) {
    return { particles: 350, pixelRatio: Math.min(devicePixelRatio, 1.5) };
  }
  if (width < 1024) {
    return { particles: 700, pixelRatio: Math.min(devicePixelRatio, 2) };
  }
  return { particles: 1200, pixelRatio: Math.min(devicePixelRatio, 2) };
}
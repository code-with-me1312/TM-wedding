export const clamp = (value: number): number => Math.min(1, Math.max(0, value));
export function smoothRange(start: number, end: number, value: number): number {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
export function sceneProgress(
  top: number,
  height: number,
  viewport: number,
): number {
  return clamp(-top / Math.max(1, height - viewport));
}
export function openingFrame(progress: number) {
  const p = clamp(progress),
    paper = smoothRange(0.08, 0.72, p),
    names = smoothRange(0.3, 0.61, p);
  return {
    envelopeLift: smoothRange(0, 0.58, p) * 95,
    envelopeOpacity: 1 - smoothRange(0.23, 0.57, p),
    paperOpacity: smoothRange(0.06, 0.29, p),
    paperScale: 0.64 + 0.36 * paper,
    paperY: (1 - paper) * 32,
    paperRotation: (paper - 1) * 5,
    namesOpacity: names,
    namesY: (1 - names) * 70,
    detailsOpacity: smoothRange(0.58, 0.85, p),
  };
}

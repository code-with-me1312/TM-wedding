import { describe, it, expect } from "vitest";
import {
  openingFrame,
  sceneProgress,
  smoothRange,
} from "../src/app/shared/scroll-motion";
describe("Scroll-driven invitation choreography", () => {
  it("uses the full sticky travel and clamps overscroll", () => {
    expect(sceneProgress(0, 3000, 1000)).toBe(0);
    expect(sceneProgress(-1000, 3000, 1000)).toBe(0.5);
    expect(sceneProgress(-2000, 3000, 1000)).toBe(1);
    expect(sceneProgress(200, 3000, 1000)).toBe(0);
    expect(sceneProgress(-5000, 3000, 1000)).toBe(1);
  });
  it("starts with the envelope and ends with a readable full-size invitation", () => {
    expect(openingFrame(0)).toMatchObject({
      envelopeOpacity: 1,
      paperOpacity: 0,
      namesOpacity: 0,
    });
    expect(openingFrame(1)).toMatchObject({
      envelopeOpacity: 0,
      paperOpacity: 1,
      paperScale: 1,
      paperY: 0,
      paperRotation: 0,
      namesOpacity: 1,
      namesY: 0,
      detailsOpacity: 1,
    });
  });
  it("reverses deterministically instead of playing a one-shot reveal", () => {
    const before = openingFrame(0.4);
    openingFrame(0.9);
    expect(openingFrame(0.4)).toEqual(before);
    expect(openingFrame(0.3).paperScale).toBeLessThan(
      openingFrame(0.6).paperScale,
    );
    expect(openingFrame(0.3).envelopeOpacity).toBeGreaterThan(
      openingFrame(0.6).envelopeOpacity,
    );
  });
  it("resolves each interval smoothly and leaves no negative opacity", () => {
    expect(smoothRange(0.2, 0.8, 0.2)).toBe(0);
    expect(smoothRange(0.2, 0.8, 0.8)).toBe(1);
    for (const progress of [-2, 0, 0.4, 0.7, 1, 5]) {
      const frame = openingFrame(progress);
      for (const value of [
        frame.envelopeOpacity,
        frame.paperOpacity,
        frame.namesOpacity,
        frame.detailsOpacity,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { calculateDeltaMs, judgeDelta } from "./judge";

describe("judgeDelta", () => {
  it("checks PERFECT boundaries", () => {
    expect(judgeDelta(45)).toBe("perfect");
    expect(judgeDelta(-45)).toBe("perfect");
    expect(judgeDelta(46)).toBe("great");
  });

  it("checks GREAT boundaries", () => {
    expect(judgeDelta(90)).toBe("great");
    expect(judgeDelta(-90)).toBe("great");
    expect(judgeDelta(91)).toBe("good");
  });

  it("checks GOOD and MISS boundaries", () => {
    expect(judgeDelta(140)).toBe("good");
    expect(judgeDelta(-140)).toBe("good");
    expect(judgeDelta(141)).toBe("miss");
    expect(judgeDelta(-141)).toBe("miss");
  });

  it("keeps early and late signs consistent", () => {
    expect(calculateDeltaMs(950, 1_000, 0)).toBe(-50);
    expect(calculateDeltaMs(1_050, 1_000, 0)).toBe(50);
  });

  it("applies positive offset to compensate early input", () => {
    const delta = calculateDeltaMs(950, 1_000, 50);
    expect(delta).toBe(0);
    expect(judgeDelta(delta)).toBe("perfect");
  });

  it("applies negative offset to compensate late input", () => {
    const delta = calculateDeltaMs(1_050, 1_000, -50);
    expect(delta).toBe(0);
    expect(judgeDelta(delta)).toBe("perfect");
  });
});

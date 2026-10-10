import { describe, expect, it } from "vitest";
import { Sky } from "../src/world/sky";

describe("sky weight", () => {
  const hint = { radius: 20, stars: { year: -1600, latitude: 51.3, siderealHours: 5.7 } };
  it("is whole within the radius, gone a fifth beyond, and smooth between", () => {
    expect(Sky.weight(hint, 0)).toBe(1);
    expect(Sky.weight(hint, 20)).toBe(1);
    expect(Sky.weight(hint, 24)).toBe(0);
    expect(Sky.weight(hint, 30)).toBe(0);
    const mid = Sky.weight(hint, 22);
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
    expect(Sky.weight(hint, 21)).toBeGreaterThan(Sky.weight(hint, 23));
  });
});

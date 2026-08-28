import { describe, expect, it } from "vitest";
import { todayLocal } from "./date";

describe("todayLocal", () => {
  it("da la fecha en la zona del usuario, no en UTC", () => {
    // 00:30 del 1 de septiembre en UTC+2 es todavía 31 de agosto en UTC
    const medianoche = new Date(2026, 8, 1, 0, 30);
    expect(todayLocal(medianoche)).toBe("2026-09-01");
  });

  it("rellena mes y día con cero", () => {
    expect(todayLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

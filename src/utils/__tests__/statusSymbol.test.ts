import { describe, expect, it } from "vitest";
import { statusSymbol } from "../statusSymbol";

describe("statusSymbol", () => {
  it("returns + and added for added status", () => {
    const result = statusSymbol("added");

    expect(result.symbol).toBe("+");
    expect(result.className).toBe("added");
  });

  it("returns - and deleted for deleted status", () => {
    const result = statusSymbol("deleted");

    expect(result.symbol).toBe("-");
    expect(result.className).toBe("deleted");
  });

  it("returns ~ and modified for modified status", () => {
    const result = statusSymbol("modified");

    expect(result.symbol).toBe("~");
    expect(result.className).toBe("modified");
  });

  it("returns R and modified for renamed status", () => {
    const result = statusSymbol("renamed");

    expect(result.symbol).toBe("R");
    expect(result.className).toBe("modified");
  });
});

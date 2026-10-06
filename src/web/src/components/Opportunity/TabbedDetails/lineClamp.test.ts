import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { clampHidesText, lineHeightPx } from "./lineClamp";

describe("clampHidesText", () => {
  // A 24px title on a 30px line, clamped at 4 lines: the box is 120px tall
  test("a title of exactly 4 lines, with its glyph overhang, hides nothing", () => {
    assert.equal(clampHidesText(124, 120, 30), false);
  });

  test("a fifth line hides text", () => {
    assert.equal(clampHidesText(150, 120, 30), true);
  });

  test("no overflow at all hides nothing", () => {
    assert.equal(clampHidesText(60, 60, 30), false);
  });

  test("exactly half a line is still tolerated; just over it is not", () => {
    assert.equal(clampHidesText(135, 120, 30), false);
    assert.equal(clampHidesText(136, 120, 30), true);
  });

  test("the tolerance follows the line: 30px text on a 37.5px line", () => {
    assert.equal(clampHidesText(168, 150, 37.5), false);
    assert.equal(clampHidesText(188, 150, 37.5), true);
  });
});

describe("lineHeightPx", () => {
  test("a resolved px value is used as is", () => {
    assert.equal(lineHeightPx("37.5px", "30px"), 37.5);
  });

  test("normal is about 1.2 times the font size", () => {
    assert.equal(lineHeightPx("normal", "20px"), 24);
  });

  test("a bare multiplier is taken against the font size", () => {
    assert.equal(lineHeightPx("1.25", "24px"), 30);
  });
});

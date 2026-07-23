import { describe, expect, test } from "vitest";
import type { FlatTokens } from "./tokens-check";
import { renderTokensSection, replaceGeneratedSection } from "./generate-design-md";

const color = (hex: string) => ({
  alpha: 1,
  colorSpace: "srgb",
  components: [0, 0, 0] as [number, number, number],
  hex,
});

describe("renderTokensSection", () => {
  // コンテキストを列、トークンを行にしたテーブルを生成する
  test("renders one row per token with a column per context", () => {
    const contexts = new Map<string, FlatTokens>([
      ["dark", new Map([["color.text", color("#EEEEEE")]])],
      ["light", new Map([["color.text", color("#111111")]])],
    ]);

    expect(renderTokensSection(contexts)).toBe(
      [
        "| トークン | dark | light |",
        "| --- | --- | --- |",
        "| `color.text` | #EEEEEE | #111111 |",
      ].join("\n"),
    );
  });
});

describe("replaceGeneratedSection", () => {
  // マーカー間だけを差し替え、前後の手書き部分は保持する
  test("replaces only the content between markers", () => {
    const document = [
      "# rules",
      "<!-- generated:tokens:start -->",
      "old",
      "<!-- generated:tokens:end -->",
      "footer",
    ].join("\n");

    const updated = replaceGeneratedSection(document, "new");

    expect(updated).toContain("# rules");
    expect(updated).toContain("new");
    expect(updated).toContain("footer");
    expect(updated).not.toContain("old");
  });

  // マーカーがない文書はエラーにする
  test("throws when markers are missing", () => {
    expect(() => replaceGeneratedSection("# no markers", "x")).toThrow(/マーカーが必要/);
  });
});

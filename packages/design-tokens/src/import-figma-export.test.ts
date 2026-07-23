import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { planImport } from "./import-figma-export";

const writeExport = (dir: string, filename: string, modeName: string) => {
  writeFileSync(
    path.join(dir, filename),
    JSON.stringify({
      $extensions: { "com.figma.modeName": modeName },
      color: {},
    }),
  );
};

describe("planImport", () => {
  // com.figma.modeName を小文字化してファイル名に使う
  test("maps mode names to lowercase token filenames", () => {
    const exportDir = mkdtempSync(path.join(tmpdir(), "figma-export-"));
    writeExport(exportDir, "Light.tokens.json", "Light");
    writeExport(exportDir, "Dark.tokens.json", "Dark");

    const plans = planImport(exportDir, "/tokens");

    expect(
      plans.map((plan) => plan.destination).toSorted((a, b) => a.localeCompare(b)),
    ).toStrictEqual(["/tokens/dark.tokens.json", "/tokens/light.tokens.json"]);
  });

  // light / dark 以外のモード名はエラーにして Figma 側の修正を促す
  test("rejects unknown mode names", () => {
    const exportDir = mkdtempSync(path.join(tmpdir(), "figma-export-"));
    writeExport(exportDir, "Mode 1.tokens.json", "Mode 1");

    expect(() => planImport(exportDir, "/tokens")).toThrow(/未対応/);
  });

  // トークンファイルがないフォルダはエラーにする
  test("rejects a folder without token files", () => {
    const exportDir = mkdtempSync(path.join(tmpdir(), "figma-export-"));

    expect(() => planImport(exportDir, "/tokens")).toThrow(/見つからない/);
  });
});

---
status: accepted
date: 2026-07-06
---

# トークン変換エンジンに Terrazzo を採用する

## 背景と課題

DTCG JSON から CSS と Tailwind の出力を作る変換エンジンを選ぶ。用途は Web と Tailwind CSS v4 だけ。

[ハブを純DTCG に保つ](<デザイントークンの真実の源はGit上の純DTCG JSONにする.md>)決定が先にあるので、Tokens Studio の方言機能は使わない。

## 検討した選択肢

比較は [dev の PR](https://github.com/nozomiishii/dev/pull/2995) で行った。

- Style Dictionary v5: 事実上の標準。Tailwind v4 の出力は自作 format になる
- Terrazzo v2.4: DTCG 専業

## 決定

Terrazzo を採用する。決め手は 3 つ。

- Tailwind v4 の公式プラグインがある
- DTCG 2025.10 のリゾルバに先行対応している
- lint を内蔵している

## 結果

### 良くなったこと

- Tailwind v4 の出力を自作 format なしで保守できる

### 引き受けたコスト

- Terrazzo は小規模チームの開発でバス係数のリスクがある。ハブが純DTCG なので、Style Dictionary への乗り換えは設定の書き換えで済む
- Terrazzo の lint はデフォルトコンテキストしか検査しないことを実測で確認した。全コンテキストの検査は `src/tokens-check.ts` で補う

### 保留した論点

なし

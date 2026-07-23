# トークン変換エンジンに Terrazzo を採用する

Status: accepted
Date: 2026-07-06

## Context — 判断を迫られた状況

候補は Style Dictionary v5（事実上の標準）と Terrazzo v2.4（DTCG 専業）。
用途は Web + Tailwind CSS v4 のみで、Tokens Studio の方言機能は
使わない方針が先に決まっていた（純DTCGハブの ADR を参照）。
比較の経緯は [#2995](https://github.com/nozomiishii/dev/pull/2995) を参照。

## Decision — 決めたこと

Terrazzo を採用する。決め手は Tailwind v4 公式プラグイン、
DTCG 2025.10 リゾルバへの先行対応、lint の内蔵。
Style Dictionary は Tailwind v4 出力が自作 format になる。

## Consequences — 決定がもたらすもの

- Terrazzo は小規模チーム開発でバス係数リスクがある。ただしハブが
  純DTCGなので Style Dictionary への乗り換えは設定の書き換えで済む
- Terrazzo lint はデフォルトコンテキストしか検査しない（実測）。
  全コンテキストの検査は `src/tokens-check.ts` で補完する

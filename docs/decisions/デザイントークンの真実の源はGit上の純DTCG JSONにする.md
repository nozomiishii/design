# デザイントークンの真実の源は Git 上の純DTCG JSON にする

Status: accepted
Date: 2026-07-06

## Context — 判断を迫られた状況

Figma・AIデザインツール・人間と、トークンの書き手が複数いる。
ツール方言（Tokens Studio の数式、TokensBrücke の `$extensions.mode`）を
ハブに入れると、読む側全員が方言知識を持たない限り誤読する。
実測では素の Style Dictionary が `"8*2"` をエラーなしで `8rem` に変換した。
検討の経緯は [#2995](https://github.com/nozomiishii/dev/pull/2995) を参照。

## Decision — 決めたこと

`packages/design-tokens/tokens/` のモード別 DTCG 2025.10 JSON と
リゾルバ文書を唯一の真実の源とする。方言はハブ手前の変換で吸収し、
全ての書き手は PR としてここに収束させる。

## Consequences — 決定がもたらすもの

- エンジン（Terrazzo / Style Dictionary）と橋（TokensBrücke / 公式）が
  交換可能な部品になる
- 輸送形式ごとに正規化の糊が要る（`src/split-figma-push.ts` 等）
- AI がトークンを読むとき前処理なしで正しく解釈できる

---
status: accepted
date: 2026-07-06
---

# デザイントークンの真実の源は Git 上の純DTCG JSON にする

## 背景と課題

トークンの書き手は Figma・AI デザインツール・人間と複数いる。

ツール方言をハブに入れると、読む側全員が方言の知識を持たない限り誤読する。実測では、素の Style Dictionary が数式の `"8*2"` をエラーなしで `8rem` に変換した。

## 検討した選択肢

検討は [dev の PR](https://github.com/nozomiishii/dev/pull/2995) で行った。

- 方言込みで持つ: Tokens Studio の数式や TokensBrücke の `$extensions.mode` をそのまま置く。書き手のツールを選ばない
- 純DTCG で持つ: 輸送形式ごとに正規化の処理が要る

## 決定

`packages/design-tokens/tokens/` のモード別 DTCG 2025.10 JSON と、それを束ねる `tokens.resolver.json` を唯一の真実の源とする。

方言はハブ手前の変換で吸収し、全ての書き手は PR としてここに収束させる。

## 結果

### 良くなったこと

- エンジンの Terrazzo / Style Dictionary と、橋の TokensBrücke / 公式エクスポートが交換可能な部品になる
- AI がトークンを読むとき、前処理なしで正しく解釈できる

### 引き受けたコスト

- 輸送形式ごとに正規化の糊が要る。TokensBrücke の push は `src/split-figma-push.ts`、公式エクスポートは `src/import-figma-export.ts` が受ける

### 保留した論点

なし

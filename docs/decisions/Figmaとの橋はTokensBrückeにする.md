---
status: accepted
date: 2026-07-06
---

# Figma との橋は TokensBrücke にする

## 背景と課題

Figma Variables を Git 上のトークンへ運ぶ経路を決める。毎回の手動エクスポートは避けたい。

## 検討した選択肢

[プラグイン 10 種を比較した](https://github.com/nozomiishii/dev/pull/2995)。

- Figma 公式のエクスポート: 手動ダウンロードのみ。Git / PR 連携がない
- Variables REST API: Enterprise 限定で Education プランでは使えない
- TokensBrücke: GitHub への PR 作成まで自動化でき、DTCG 2025.10 表記に対応する
- 他のプラグイン: 両方は満たさない

## 決定

TokensBrücke の GitHub PR push を正の経路にする。公式エクスポートと `pnpm import:figma` はフォールバックとして残す。

## 結果

### 良くなったこと

- デザイナーの手順が Figma で Push to server を押すだけになる

### 引き受けたコスト

- push されるのは単一ファイルで、モードは `$extensions.mode` に入る。モード別への分割と生成物の再生成は、design-tokens-sync の CI が PR ブランチにコミットする

### 保留した論点

- 公式が Git / PR 連携と composite tokens への対応を出したら橋を差し替える。brain の monthly-figma-dtcg-export-watch routine が毎月監視している

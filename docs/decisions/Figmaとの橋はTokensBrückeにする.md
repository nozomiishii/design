# Figma との橋は TokensBrücke にする

Status: accepted
Date: 2026-07-06

## Context — 判断を迫られた状況

Figma 公式エクスポートは手動ダウンロードのみで Git/PR 連携がない。
Variables REST API は Enterprise 限定で Education プランでは使えない。
毎回の手動エクスポートを避けたい。プラグイン10種を比較した結果、
GitHub への PR 作成まで自動化でき DTCG 2025.10 表記に対応するのは
実質 TokensBrücke のみだった。
経緯は [#2995](https://github.com/nozomiishii/dev/pull/2995) を参照。

## Decision — 決めたこと

TokensBrücke の GitHub PR push を正の経路にする。
公式エクスポート + `pnpm import:figma` はフォールバックとして残す。

## Consequences — 決定がもたらすもの

- push は単一ファイル（`$extensions.mode`）なので、CI
  （design-tokens-sync）が分割と再生成を PR ブランチにコミットする
- 公式が Git/PR 連携と composite 対応を出したら橋を差し替える。
  brain の monthly-figma-dtcg-export-watch routine が毎月監視している

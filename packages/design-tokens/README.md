# @nozomiishii/design-tokens

デザイントークンの真実の源。Figma Variables と Tailwind CSS v4 を DTCG 2025.10 でつなぐ。

## 仕組み

```txt
Figma Variables（light / dark モード）
  │ TokensBrücke の Push to server（GitHub PR）
  ▼
figma-export.tokens.json（単一ファイル。モードは $extensions.mode に入る）
  │ CI (design-tokens-sync) が分割・再生成して PR ブランチにコミット
  ▼
tokens/light.tokens.json, tokens/dark.tokens.json（純DTCG 2025.10）
  │ tokens.resolver.json が束ねる
  │ Terrazzo でビルド
  ├─► generated/tokens.css（CSS変数。:root と [data-theme="dark"]）
  ├─► generated/tailwind-theme.css（Tailwind v4 @theme）
  └─► DESIGN.md の値セクション（AI用。ルールは手書き）
```

デザイナーのフローは「Figma でプラグインを開いて Push to server を押す」だけ。
分割・検査・生成は CI が済ませ、いつもの CI（design-tokens-ci）が緑なら安全にマージできる。

## TokensBrücke の設定

プラグイン: <https://www.figma.com/community/plugin/1254538877056388290/tokens-bruecke>

General settings:

- Use DTCG keys format: on
- Color mode: `sRGB DTCG`
- Include styles / variable scopes / Figma metadata: すべて off
- Include `.value` string for aliases: off
- Omit collection names: on（トークンIDを `color.*` のフラットな形にするため）

Push to server で GitHub PR を選び:

- Personal access token: `repo` スコープの PAT
- Owner: `nozomiishii` / Repository: `design` / Branch: `figma-tokens`
- File name: `packages/design-tokens/figma-export.tokens.json`
- Commit message: `chore(tokens): update tokens from figma`

## コマンド

```bash
pnpm lint                                    # tz lint + 全コンテキスト検査（コントラスト・過不足）
pnpm build                                   # generated/ と DESIGN.md 値セクションを再生成
pnpm test                                    # 検査ロジックのテスト
pnpm exec tsx src/split-figma-push.ts        # figma-export.tokens.json を手元で分割（CIと同じ処理）
pnpm import:figma <エクスポートフォルダ>      # 公式エクスポート（フォールバック）の取り込み
```

## 運用ルール

- `tokens/` の値は Figma が上流。手で書き換えず、TokensBrücke で push する
- `figma-export.tokens.json` は輸送用の中間ファイル。ここも手で編集しない
- `generated/` と DESIGN.md の値セクションは生成物。手で編集しない。CI が再生成して差分が出ると落ちる
- Figma のモード名は light / dark にする
- Tokens Studio の方言（数式・modify）は持ち込まない。純DTCGを保つとエンジンも橋も交換可能になる

## トークンを増やすとき

- Figma Variables に light / dark 両方の値を追加する（片方だけだと lint で落ちる）
- テキストと背景の組を増やしたら `src/tokens-check.ts` の CONTRAST_PAIRS に追加する
- `terrazzo.config.ts` の tailwind theme マッピングに新しいグループを足す

トークンを増やすだけなら push だけで通る。CSS 変数も Tailwind の `@theme` も自動で増える。

## トークンを消す・リネームするとき

`src/tokens-check.ts` の REQUIRED_TOKENS から外す。載ったままだと lint が落ちる。
利用側が壊れる変更なので、Figma だけで完結させない。

## 公式エクスポート（フォールバック）

Figma でコレクションを右クリック → Export to JSON でモード別の純DTCGファイルが取れる。
TokensBrücke が使えないときは `pnpm import:figma` で取り込む。

公式エクスポートには Git 連携・PR 作成がまだなく、composite tokens
（typography / shadow / gradient）も未対応。対応状況は毎月5日の routine
（nozomiishii/brain の monthly-figma-dtcg-export-watch）が監視しており、
公式が揃い次第この橋を公式機能へ差し替える。

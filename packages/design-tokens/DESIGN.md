# デザインシステム

AI と人間の両方が読む。値のセクションは自動生成なので手で編集しない。
ルールのセクションだけ手で育てる。

## ルール

- 色は必ず semantic トークン（`color.*`）を使う。hex や rgb の直値は書かない
- Tailwind ではトークン由来のユーティリティ（`bg-background` `text-text` 等）を使う。arbitrary value（`bg-[#fff]`）は禁止
- ダークモードは `[data-theme="dark"]` で切り替える。`dark:` variant で個別調整せず、トークンの dark 値で解決する

## トークン値（自動生成）

<!-- generated:tokens:start -->

| トークン | light | dark |
| --- | --- | --- |
| `color.background` | #FFFFFF | #111111 |
| `color.text` | #111111 | #EEEEEE |

<!-- generated:tokens:end -->

値を変えたいときは Figma Variables を変更し、エクスポートを取り込んで再生成する。

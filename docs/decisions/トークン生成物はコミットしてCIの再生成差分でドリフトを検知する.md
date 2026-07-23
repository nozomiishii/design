# トークン生成物はコミットして CI の再生成差分でドリフトを検知する

Status: accepted
Date: 2026-07-06

## Context — 判断を迫られた状況

基盤の目的は Figma とコードのずれを防ぐこと。生成物（theme.css 等）を
コミットしないと、手編集や再生成忘れによるずれを検知する場所がない。
ルートの .gitignore は dist を全域無視している。また prettier が
生成物を再整形すると、再生成の差分比較と衝突する。
経緯は [#2995](https://github.com/nozomiishii/dev/pull/2995) を参照。

## Decision — 決めたこと

出力先を `generated/` にしてコミット対象とする。build は生成直後に
prettier を通して冪等化する。CI は test → lint → build →
`git diff --exit-code` の順で、差分が出たら落とす。

## Consequences — 決定がもたらすもの

- トークン変更 PR は必ず再生成済みの生成物を含む。TokensBrücke 経路は
  sync CI が自動でコミットする
- 生成物の手編集は CI で必ず露見する
- lint の抑制はせず、生成と整形の順序で prettier と共存させた

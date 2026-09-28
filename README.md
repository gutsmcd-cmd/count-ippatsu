# カウント一発（Count Ippatsu）

大きなボタンでタップして数える、カウンター PWA。**無料・広告なし・ログイン不要・通信なし・オフライン対応。**

## できること

- 画面いっぱいの大きなタップエリアで +1（1回で増やす数も変更可）
- +／− ボタン
- 名前付きのカウンターを複数作成、色分け、上のタブで切り替え
- タップ時のバイブ（オン／オフ）
- リセットは確認付き、さらに「元に戻す」も可能
- 数は自動で保存され、アプリを閉じても残ります
- 表示言語：日本語 / English

データはこの端末の localStorage にだけ保存されます。

## English

**Count Ippatsu** is a tally counter with a huge tap target. Multiple named, colour-coded counters, +/- buttons, adjustable step, optional vibration, reset with confirmation (and undo), and persistent state. Japanese UI by default with an English toggle. Free, no ads, no login, no network; works offline.

## 開発 / Development

```bash
npm install
npm run dev      # 開発サーバー / dev server
npm run build    # 型チェック + ビルド → dist/ / type-check + build
npm run preview  # ビルドの確認 / preview the build
```

Vite + vanilla TypeScript + vite-plugin-pwa（`registerType: 'autoUpdate'`, `base: './'`）。`main` ブランチに push すると `.github/workflows/pages.yml` で GitHub Pages に公開されます。 / Pushing to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`.

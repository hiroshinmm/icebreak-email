# TFTCentral画像取得問題の調査と堅牢性向上プラン

TFTCentralなどの特定のサイトで画像が正しく取得できていなかった問題を解決し、今後の画像抽出ロジックをより堅牢にするための変更案です。

## 調査結果と原因分析

調査の結果、以下の可能性が浮上しました：

1.  **タイムアウトの発生**: `fetchOgImage` 関数での `axios` 取得タイムアウトが 5秒 と短く、GitHub Actions 環境での実行時に TFTCentral のような応答が遅いサイトでタイムアウトが発生していた可能性があります。
2.  **相対パスへの未対応**: 現行ロジックでは `og:image` や記事内画像が相対パス（`/wp-content/...`など）であった場合、取得に失敗（nullを返す）する仕様になっていました。
3.  **リダイレクトによる遅延**: `sources.json` に記載された TFTCentral のURLに不要な `www` が含まれており、リダイレクトによるオーバーヘッドが発生していました。
4.  **ロジックの不備**: `og:image` が見つかったもののそれが無効な形式だった場合、記事内画像を探すフォールバック処理が走らない構造になっていました。

## 提案される変更

### 1. `src/newsFetcher.js` の改善
- **タイムアウト延長**: `axios` のタイムアウトを10秒に延長します。
- **相対パスの解決**: `URL` クラスを使用して、相対パスを絶対パスに自動変換するロジックを追加します。
- **抽出ロジックの強化**: `og:image` が無効な場合でも記事内画像を再探索するようにし、また Lazy Loading (`data-src`) にも対応します。
- **詳細ログの追加**: 画像取得に失敗した際に、その原因（404, タイムアウトなど）をログに出力するようにします。

### 2. `config/sources.json` の修正
- TFTCentral の URL から `www` を削除し、リダイレクトを回避します。

### 3. `src/imageProcessor.js` の微調整
- **User-Agent の更新**: Puppeteer で使用する User-Agent を最新のものに更新します。

---

## 修正ファイル一覧

#### [MODIFY] [newsFetcher.js](file:///c:/Users/hiros/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/Antigravity/weekly-icebreak-email/src/newsFetcher.js)
- `fetchOgImage` 関数のタイムアウト、相対パス対応、ロジック改善。

#### [MODIFY] [sources.json](file:///c:/Users/hiros/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/Antigravity/weekly-icebreak-email/config/sources.json)
- TFTCentral の URL を `https://tftcentral.co.uk/feed` に修正。

#### [MODIFY] [imageProcessor.js](file:///c:/Users/hiros/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/Antigravity/weekly-icebreak-email/src/imageProcessor.js)
- User-Agent の更新。

## 検証プラン

### 自動テスト
- ローカル環境で `repro_issue.js` を実行し、修正後のロジックで画像が正しく取得できることを確認します。
- 意図的にタイムアウトを短くしたり、相対パスを模したHTMLでテストし、正しく動作することを確認します。

### 手動確認
- 修正後の `index.js` を実行し、TFTCentral の各URLに対して画像が正しく保存されることを確認します。

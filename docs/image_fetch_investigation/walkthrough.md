# TFTCentral等からの画像フェッチ問題の修正完了

GitHub Actions のような環境から実行した際に、TFTCentral などの特定のサイトで記事画像が正しく取得できない（フォールバック用画像が使われてしまう）問題を修正しました。

## 実施した変更

### 1. `src/newsFetcher.js` の堅牢化
- **タイムアウトの延長**: Axios のリクエストタイムアウトを `5000ms` から `10000ms` に延長し、ページの読み込みに時間がかかるサイトでの取得失敗を防ぎました。
- **相対パスの絶対パス化**: サイトから抽出した `og:image` や `<img>` の `src` 属性が `/wp-content/...` のような相対パスであった場合でも、`new URL(src, articleUrl).href` を用いて正しい絶対パスに解決する処理を実装しました。
- **Lazy Loading 対応とフォールバックの強化**: `<img data-src="..."/>` といった遅延読み込み属性を使用しているサイトにも対応しました。また、抽出した `og:image` のURLフォーマットが不正な場合には、記事内の画像を優先して探索するようにフォールバック処理を強化しました。
- **エラーログの出力**: 取得に失敗した場合の原因を特定しやすくするため、詳細なエラーメッセージを出力するようにしました。

```diff
-        const res = await axios.get(articleUrl, {
-            timeout: 5000,
-            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
-        });
+        const res = await axios.get(articleUrl, {
+            timeout: 10000,
+            headers: { 
+                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
+                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
+            }
+        });
```

### 2. `config/sources.json` の最適化
- **リダイレクトの削減**: TFTCentral のフィードURLから `www` を削除し、`https://tftcentral.co.uk/feed` へ変更しました。これにより無駄なリダイレクトを回避し、取得速度を安定させました。

### 3. `src/imageProcessor.js` のブラウザ偽装の強化
- **User-Agentの更新**: Puppeteerによる画像処理プロセスで使用される User-Agent を、より新しいバージョンの Chrome (`Chrome/123.0.0.0`) を模したものに更新しました。

## 検証結果

ローカル環境にて上記修正を取り込んだ状態で TFTCentral の最新記事データをテスト取得した結果、これまで抽出できていなかった記事の画像（`xxxx_banner.jpg` など）が正常に取得されることを確認しました。

```
Testing fetchTopics with TFTCentral...
Fetching topics from multiple sources...
Aggregated 1 topics (History filtered).
Title: EIZO Launch the ColorEdge CS3200X, the First 31.5″ 4K Model in Their CS Series
URL: https://tftcentral.co.uk/news/eizo-launch-the-coloredge-cs3200x-the-first-31-5-4k-model-in-their-cs-series
Image: https://tftcentral.co.uk/wp-content/uploads/2026/04/Eizo-ColorEdge-CS3200X_6-1.jpg
---
```

これらの修正により、次回の定期実行（GitHub Actions経由）から画像の取りこぼしが大幅に改善される見込みです。

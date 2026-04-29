const { extractImageFromHtml } = require('../src/imageExtractor');

describe('extractImageFromHtml', () => {
    const BASE = 'https://example.com/article/1';

    test('og:image を返す', () => {
        const html = '<html><head><meta property="og:image" content="https://example.com/img.jpg"></head></html>';
        expect(extractImageFromHtml(html, BASE)).toBe('https://example.com/img.jpg');
    });

    test('twitter:image にフォールバックする', () => {
        const html = '<html><head><meta name="twitter:image" content="https://example.com/tw.jpg"></head></html>';
        expect(extractImageFromHtml(html, BASE)).toBe('https://example.com/tw.jpg');
    });

    test('og:image が相対パスの場合に解決する', () => {
        const html = '<html><head><meta property="og:image" content="/images/hero.jpg"></head></html>';
        expect(extractImageFromHtml(html, BASE)).toBe('https://example.com/images/hero.jpg');
    });

    test('og:image がない場合は article img にフォールバックする', () => {
        const html = '<html><body><article><img src="https://cdn.example.com/photo.png"></article></body></html>';
        expect(extractImageFromHtml(html, BASE)).toBe('https://cdn.example.com/photo.png');
    });

    test('アイコン系の画像はスキップする', () => {
        const html = '<html><body><article><img src="https://cdn.example.com/avatar.png"><img src="https://cdn.example.com/photo.png"></article></body></html>';
        expect(extractImageFromHtml(html, BASE)).toBe('https://cdn.example.com/photo.png');
    });

    test('data-src (lazy loading) を読む', () => {
        const html = '<html><body><article><img data-src="https://cdn.example.com/lazy.jpg"></article></body></html>';
        expect(extractImageFromHtml(html, BASE)).toBe('https://cdn.example.com/lazy.jpg');
    });

    test('画像が一切ない場合は null を返す', () => {
        const html = '<html><body><p>no images here</p></body></html>';
        expect(extractImageFromHtml(html, BASE)).toBeNull();
    });
});

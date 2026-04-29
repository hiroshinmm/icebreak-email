const cheerio = require('cheerio');

function extractImageFromHtml(html, articleUrl) {
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content')
        || $('meta[name="twitter:image"]').attr('content');

    if (ogImage) {
        try {
            const resolved = new URL(ogImage, articleUrl).href;
            if (resolved.match(/^https?:\/\//i)) return resolved;
        } catch (e) {}
    }

    const possibleImgs = $('article img, .post-content img, .entry-content img, main img').toArray();
    for (const img of possibleImgs) {
        const src = $(img).attr('src') || $(img).attr('data-src');
        const isIcon = src && (src.includes('avatar') || src.includes('profile') || src.match(/favicon|logo|icon|v\.svg|vg_logo/i));
        if (src && !isIcon) {
            try {
                const resolvedUrl = new URL(src, articleUrl).href;
                if (resolvedUrl.match(/^https?:\/\//i)) return resolvedUrl;
            } catch (e) {}
        }
    }
    return null;
}

module.exports = { extractImageFromHtml };

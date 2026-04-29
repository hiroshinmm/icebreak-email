const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function testFetchOgImageCloudflare(articleUrl) {
    try {
        console.log(`Trying axios for ${articleUrl}`);
        const res = await axios.get(articleUrl, {
            timeout: 10000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        console.log(`Axios success: ${res.status}`);
        return extractImageFromHtml(res.data, articleUrl);
    } catch (e) {
        console.error(`Axios failed: ${e.message}`);
        if (e.response && (e.response.status === 403 || e.response.status === 503)) {
            console.log(`Cloudflare blocked. Trying Puppeteer fallback...`);
            return await fetchOgImagePuppeteer(articleUrl);
        }
    }
    return null;
}

function extractImageFromHtml(html, articleUrl) {
    const $ = cheerio.load(html);
    let ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    
    if (!ogImage || !ogImage.match(/^https?:\/\//i)) {
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
    } else {
        try { return new URL(ogImage, articleUrl).href; } catch (e) {}
    }
    return ogImage && ogImage.match(/^https?:\/\//i) ? ogImage : null;
}

async function fetchOgImagePuppeteer(articleUrl) {
    console.log(`Launching Puppeteer for: ${articleUrl}`);
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    try {
        await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const html = await page.content();
        await browser.close();
        return extractImageFromHtml(html, articleUrl);
    } catch (e) {
        console.error(`Puppeteer failed: ${e.message}`);
        await browser.close();
    }
    return null;
}

testFetchOgImageCloudflare('https://tftcentral.co.uk/resources/monitor-launch-tracker').then(console.log);

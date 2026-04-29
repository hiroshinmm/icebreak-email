const axios = require('axios');
const Parser = require('rss-parser');
const { extractImageFromHtml } = require('./imageExtractor');
const { getBrowser } = require('./browserManager');

const parser = new Parser();

async function fetchOgImage(articleUrl) {
    if (!articleUrl || articleUrl === '#') return null;
    try {
        const res = await axios.get(articleUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        return extractImageFromHtml(res.data, articleUrl);
    } catch (e) {
        console.error(`Failed to fetch OG image with axios for ${articleUrl}: ${e.message}`);

        if (e.response && (e.response.status === 403 || e.response.status === 503)) {
            console.log(`Cloudflare block detected. Falling back to Puppeteer...`);
            try {
                const browser = await getBrowser();
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
                await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                const html = await page.content();
                await page.close();
                return extractImageFromHtml(html, articleUrl);
            } catch (puppeteerErr) {
                console.error(`Puppeteer fallback also failed for ${articleUrl}: ${puppeteerErr.message}`);
            }
        }
    }
    return null;
}

async function fetchTopics(sources, history = {}) {
    console.log('Fetching topics from multiple sources...');
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

    const sourcePromises = sources.map(async (source) => {
        const urlFetchPromises = source.urls.map(async (feedUrl) => {
            const urlTopics = [];
            try {
                const feed = await parser.parseURL(feedUrl);
                for (const item of feed.items) {
                    const pubDate = new Date(item.pubDate || item.isoDate);
                    if (pubDate < tenDaysAgo) continue;

                    const content = (item.title + (item.contentSnippet || '')).toLowerCase();
                    const isRelevant = source.keywords.some(kw => content.includes(kw.toLowerCase()));

                    if (isRelevant) {
                        let imageUrl = null;
                        const possibleImageLocations = [
                            item.enclosure?.url,
                            item['media:group']?.['media:thumbnail']?.[0]?.url,
                            item['media:thumbnail']?.url,
                            item.content?.match(/<img[^>]+src="([^">]+)"/i)?.[1],
                            item['content:encoded']?.match(/<img[^>]+src="([^">]+)"/i)?.[1],
                            item.description?.match(/<img[^>]+src="([^">]+)"/i)?.[1],
                            item.itunes?.image,
                            item.image?.url
                        ];

                        for (const imageLocation of possibleImageLocations) {
                            if (imageLocation && imageLocation.match(/^https?:\/\//i)) {
                                if (imageLocation.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i) ||
                                    imageLocation.includes('/image') || imageLocation.includes('/img') ||
                                    imageLocation.includes('cdn') || imageLocation.includes('media') ||
                                    imageLocation.includes('ytimg')) {
                                    imageUrl = imageLocation;
                                    break;
                                }
                            }
                        }

                        if (!imageUrl && item.link && item.link.includes('youtube.com/watch')) {
                            const videoId = item.link.match(/v=([^&]+)/)?.[1];
                            if (videoId) imageUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
                        }

                        const cleanSnippet = (item.contentSnippet || item.content || '').replace(/(<([^>]+)>)/gi, "").trim();

                        if (!imageUrl && item.link) {
                            imageUrl = await fetchOgImage(item.link);
                        }

                        urlTopics.push({
                            title: item.title,
                            link: item.link,
                            tag: source.category,
                            pubDate: pubDate.toLocaleDateString('ja-JP'),
                            snippet: cleanSnippet.length > 200 ? cleanSnippet.slice(0, 200) : cleanSnippet,
                            imageUrl: imageUrl,
                            insight: ''
                        });
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch from ${feedUrl}:`, err.message);
            }
            return urlTopics;
        });

        const results = await Promise.all(urlFetchPromises);
        return results.flat();
    });

    const results = await Promise.all(sourcePromises);
    const allTopics = results.flat();

    const uniqueTopics = Array.from(new Map(allTopics.map(t => [t.link, t])).values());
    const finalTopics = [];

    for (const source of sources) {
        const categoryTopics = uniqueTopics.filter(t => t.tag === source.category && !history[t.link]);

        if (categoryTopics.length > 0) {
            finalTopics.push(categoryTopics[0]);
        } else {
            finalTopics.push({
                title: "今週の最新ニュースはありませんでした",
                link: "#",
                tag: source.category,
                pubDate: "---",
                snippet: "該当カテゴリの過去10日以内で、まだ配信されていない関連ニュースは見つかりませんでした。",
                imageUrl: null,
                insight: "引き続き次回以降のアップデートにご期待ください。"
            });
        }
    }

    console.log(`Aggregated ${finalTopics.length} topics (History filtered).`);
    return finalTopics;
}

module.exports = { fetchTopics };

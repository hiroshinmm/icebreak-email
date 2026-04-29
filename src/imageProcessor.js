const fs = require('fs');
const path = require('path');
const { getBrowser } = require('./browserManager');

async function processNewsImages(topics, outputDir) {
    if (topics.length === 0) return [];
    console.log('Processing images...');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const browser = await getBrowser();

    const results = await Promise.all(topics.map(async (topic, index) => {
        const isDummy = topic.link === '#' || topic.title.includes('今週の最新ニュースはありませんでした');
        if (isDummy) return null;

        if (!topic.imageUrl) {
            const fallbackPath = path.join(__dirname, '..', 'dist', 'assets', 'fallback.png');
            return { path: fallbackPath, filename: 'fallback.png', cid: `news_image_${index}` };
        }

        console.log(`Processing image ${index}: ${topic.tag}...`);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
        await page.setViewport({ width: 600, height: 100 });

        const safeImageUrl = topic.imageUrl.replace(/"/g, '&quot;');
        const htmlContent = `<!DOCTYPE html><html><body style="margin:0;padding:0;"><img id="news-img" src="${safeImageUrl}" style="width:600px;height:auto;display:block;"></body></html>`;

        await page.setContent(htmlContent, { waitUntil: 'networkidle2' });

        try {
            await page.waitForFunction(() => {
                const img = document.getElementById('news-img');
                return img && img.complete && img.naturalHeight !== 0;
            }, { timeout: 10000 });
        } catch (e) {
            console.log(`Warning: Image ${index} might not have loaded correctly. Using fallback.`);
            const fallbackPath = path.join(__dirname, '..', 'dist', 'assets', 'fallback.png');
            await page.close();
            return { path: fallbackPath, filename: 'fallback.png', cid: `news_image_${index}` };
        }

        const body = await page.$('body');
        const fileName = `news_image_${index}.png`;
        const outputPath = path.join(outputDir, fileName);

        await body.screenshot({ path: outputPath });
        await page.close();

        return { path: outputPath, filename: fileName, cid: `news_image_${index}` };
    }));

    console.log('All images processed successfully.');
    return results.filter(a => a !== null);
}

module.exports = { processNewsImages };

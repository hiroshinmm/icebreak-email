const puppeteer = require('puppeteer');
const path = require('path');

async function testImageProcessor(imageUrl) {
    console.log(`Processing image: ${imageUrl}...`);
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 600, height: 100 });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0;">
        <img id="news-img" src="${imageUrl}" style="width: 600px; height: auto; display: block;">
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle2' });
    
    try {
        await page.waitForFunction(() => {
            const img = document.getElementById('news-img');
            return img && img.complete && img.naturalHeight !== 0;
        }, { timeout: 10000 });
        console.log(`Image loaded successfully.`);
        
        const body = await page.$('body');
        const outputPath = path.join(__dirname, 'test_tracker.png');
        await body.screenshot({ path: outputPath });
        console.log(`Screenshot saved to ${outputPath}`);
    } catch (e) {
        console.log(`Warning: Image might not have loaded correctly. Error: ${e.message}`);
    }

    await browser.close();
}

testImageProcessor('https://tftcentral.co.uk/wp-content/uploads/2026/04/launch_tracker_banner_2.jpg').then(() => {
    console.log('Finished');
});

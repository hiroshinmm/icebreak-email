const { fetchTopics } = require('./src/newsFetcher');
const axios = require('axios');
const cheerio = require('cheerio');

async function testFetchOgImage(articleUrl) {
    if (!articleUrl || articleUrl === '#') return null;
    try {
        const res = await axios.get(articleUrl, {
            timeout: 10000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        const $ = cheerio.load(res.data);
        console.log(`Title from head: ${$('title').text()}`);
        
        let ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        console.log(`Initial ogImage from meta: ${ogImage}`);
        
        if (!ogImage || !ogImage.match(/^https?:\/\//i)) {
            console.log(`og:image not found or invalid, searching article tags...`);
            const possibleImgs = $('article img, .post-content img, .entry-content img, main img').toArray();
            console.log(`Found ${possibleImgs.length} possible images in content tags.`);
            
            for (const img of possibleImgs) {
                const src = $(img).attr('src') || $(img).attr('data-src');
                console.log(`Checking img src: ${src}`);
                const alt = $(img).attr('alt') || '';
                const isIcon = src && (src.includes('avatar') || src.includes('profile') || src.match(/favicon|logo|icon|v\.svg|vg_logo/i));
                
                if (src && !isIcon) {
                    try {
                        const resolvedUrl = new URL(src, articleUrl).href;
                        if (resolvedUrl.match(/^https?:\/\//i)) {
                            ogImage = resolvedUrl;
                            console.log(`Found valid image src: ${ogImage}`);
                            break;
                        }
                    } catch (e) {
                         console.error(`Error resolving URL for ${src}: ${e.message}`);
                    }
                }
            }
            
            // If still no image found in article tags, look everywhere
            if (!ogImage || !ogImage.match(/^https?:\/\//i)) {
                 console.log(`Still no image found, searching all img tags...`);
                 $('img').each((i, el) => {
                     let src = $(el).attr('src') || $(el).attr('data-src');
                     if (src && i < 10) console.log(`Fallback img src[${i}]: ${src}`);
                 });
            }
            
        } else {
            console.log(`ogImage is valid: ${ogImage}`);
            try {
                ogImage = new URL(ogImage, articleUrl).href;
            } catch (e) {
                console.log(`Failed to resolve ogImage: ${e.message}`);
            }
        }

        if (ogImage && ogImage.match(/^https?:\/\//i)) {
            return ogImage;
        }
    } catch (e) {
        console.error(`Failed to fetch OG image for ${articleUrl}: ${e.message}`);
    }
    return null;
}

testFetchOgImage('https://tftcentral.co.uk/resources/monitor-launch-tracker').then(url => {
    console.log(`Final Result: ${url}`);
});

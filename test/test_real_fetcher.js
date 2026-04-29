const { fetchTopics } = require('./src/newsFetcher');
async function test() {
    const sources = [
        {
            "category": "Display/TFT",
            "urls": ["https://tftcentral.co.uk/feed"],
            "keywords": ["monitor"]
        }
    ];
    // Block the EIZO article so it looks at the tracker
    const history = {
        'https://tftcentral.co.uk/news/eizo-launch-the-coloredge-cs3200x-the-first-31-5-4k-model-in-their-cs-series': true
    };
    
    const topics = await fetchTopics(sources, history);
    console.log(topics);
}
test();

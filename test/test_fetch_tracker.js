const { fetchTopics } = require('./src/newsFetcher');
const sources = [
    {
        "category": "Display/TFT",
        "urls": [
            "https://tftcentral.co.uk/feed"
        ],
        "keywords": [
            "monitor"
        ]
    }
];

// simulate history to block EIZO article so Monitor Launch Tracker is picked
const history = {
    'https://tftcentral.co.uk/news/eizo-launch-the-coloredge-cs3200x-the-first-31-5-4k-model-in-their-cs-series': true
};

async function run() {
    console.log('Testing fetchTopics with TFTCentral, blocking EIZO to get Tracker...');
    const topics = await fetchTopics(sources, history);
    for (const t of topics) {
        console.log(`Title: ${t.title}`);
        console.log(`URL: ${t.link}`);
        console.log(`Image: ${t.imageUrl}`);
        console.log('---');
    }
}
run();

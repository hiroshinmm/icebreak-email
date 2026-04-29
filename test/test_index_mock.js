const fs = require('fs');
const path = require('path');
const { fetchTopics } = require('./src/newsFetcher');
const { loadHistory } = require('./src/historyManager');

async function checkIndex() {
    console.log('Running fetchTopics as index.js does...');
    const sourcesPath = path.join(__dirname, 'config', 'sources.json');
    let sources = JSON.parse(fs.readFileSync(sourcesPath));

    // Dummy history containing nothing so we fetch fresh
    const history = loadHistory();
    const topics = await fetchTopics(sources, history);

    const tftTopic = topics.find(t => t.tag === 'Display/TFT');
    console.log('Display/TFT Topic:');
    console.log(tftTopic);
}
checkIndex();

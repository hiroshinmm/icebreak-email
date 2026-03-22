const fs = require('fs');
const path = require('path');

const HISTORY_PATH = path.join(__dirname, '..', 'config', 'history.json');
const RETENTION_DAYS = 10;

/**
 * 履歴データを読み込み、古いエントリを削除する
 * @returns {Object} 履歴データ { url: timestamp }
 */
function loadHistory() {
    if (!fs.existsSync(HISTORY_PATH)) {
        return {};
    }

    try {
        const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
        return filterOldEntries(history);
    } catch (e) {
        console.error('Failed to load history:', e.message);
        return {};
    }
}

/**
 * 履歴データを保存する
 * @param {Object} history 
 */
function saveHistory(history) {
    try {
        const directory = path.dirname(HISTORY_PATH);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        const filtered = filterOldEntries(history);
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to save history:', e.message);
    }
}

/**
 * 指定した日数を経過した古いエントリを削除する
 * @param {Object} history 
 * @returns {Object} フィルタリング後の履歴
 */
function filterOldEntries(history) {
    const now = Date.now();
    const threshold = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const filtered = {};

    for (const [url, timestamp] of Object.entries(history)) {
        if (now - timestamp < threshold) {
            filtered[url] = timestamp;
        }
    }
    return filtered;
}

/**
 * 新しい記事を履歴に追加する
 * @param {Object} history 
 * @param {Array} topics 
 */
function updateHistory(history, topics) {
    const now = Date.now();
    topics.forEach(topic => {
        if (topic.link && topic.link !== '#') {
            history[topic.link] = now;
        }
    });
    return history;
}

module.exports = {
    loadHistory,
    saveHistory,
    updateHistory
};

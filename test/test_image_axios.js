const axios = require('axios');

async function run() {
    try {
        const res = await axios.head('https://tftcentral.co.uk/wp-content/uploads/2026/04/launch_tracker_banner_2.jpg');
        console.log(`Status: ${res.status}`);
        console.log(`Content-Length: ${res.headers['content-length']}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
    } catch(e) {
        console.error(`Error: ${e.message}`);
        if(e.response) {
            console.error(`Status: ${e.response.status}`);
        }
    }
}
run();

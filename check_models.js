import https from 'https';

const apiKey = 'AIzaSyAAjzSXRNvZKXUWr2Wm5fDm5S6s5NRw6tQ';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.models) {
                console.log('Available models:');
                response.models.forEach(model => {
                    if (model.name.includes('gemini')) {
                        console.log(`- ${model.name.replace('models/', '')}`);
                    }
                });
            } else {
                console.log('Error:', JSON.stringify(response, null, 2));
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Request error:', e.message);
});

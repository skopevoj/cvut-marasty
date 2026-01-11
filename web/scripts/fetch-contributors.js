const fs = require('fs');
const path = require('path');

async function fetchContributors() {
    console.log('Fetching contributors...');
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'marasty-fetch-script'
    };

    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    try {
        const response = await fetch('https://api.github.com/repos/skopevoj/cvut-marasty/contributors?per_page=100', {
            headers
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch contributors: ${response.statusText}`);
        }

        const contributors = await response.json();

        // Filter to only what we need
        const simplified = contributors.map(c => ({
            login: c.login,
            avatar_url: c.avatar_url,
            html_url: c.html_url,
            contributions: c.contributions
        }));

        const outputPath = path.join(__dirname, '../public/contributors.json');
        fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2));
        console.log(`Successfully saved ${simplified.length} contributors to ${outputPath}`);
    } catch (error) {
        console.error('Error fetching contributors:', error);
        // Create an empty array if it fails to prevent build break if desired, 
        // or let it fail. I'll create an empty one to be safe.
        const outputPath = path.join(__dirname, '../public/contributors.json');
        if (!fs.existsSync(outputPath)) {
            fs.writeFileSync(outputPath, JSON.stringify([]));
        }
    }
}

fetchContributors();

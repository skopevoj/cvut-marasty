const fs = require('fs');
const path = require('path');

async function fetchMetadata() {
    console.log('Fetching repository metadata...');
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'marasty-fetch-script'
    };

    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    try {
        const repoResponse = await fetch('https://api.github.com/repos/skopevoj/cvut-marasty', { headers });
        const contributorsResponse = await fetch('https://api.github.com/repos/skopevoj/cvut-marasty/contributors?per_page=100', { headers });

        if (!repoResponse.ok) throw new Error(`Repo fetch failed: ${repoResponse.statusText}`);
        if (!contributorsResponse.ok) throw new Error(`Contributors fetch failed: ${contributorsResponse.statusText}`);

        const repoData = await repoResponse.json();
        const contributorsData = await contributorsResponse.json();

        const metadata = {
            stargazers_count: repoData.stargazers_count,
            forks_count: repoData.forks_count,
            contributors: contributorsData.map(c => ({
                login: c.login,
                avatar_url: c.avatar_url,
                html_url: c.html_url,
                contributions: c.contributions
            }))
        };

        const outputPath = path.join(__dirname, '../public/metadata.json');
        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
        console.log(`Metadata saved to ${outputPath}`);

    } catch (error) {
        console.error('Error fetching metadata:', error);
        // Create a fallback file so the build doesn't break
        const outputPath = path.join(__dirname, '../public/metadata.json');
        if (!fs.existsSync(outputPath)) {
            fs.writeFileSync(outputPath, JSON.stringify({ stargazers_count: 0, contributors: [] }));
        }
    }
}

fetchMetadata();

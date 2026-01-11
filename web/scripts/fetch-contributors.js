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
        const [contributorsResponse, issuesResponse] = await Promise.all([
            fetch('https://api.github.com/repos/skopevoj/cvut-marasty/contributors?per_page=100', { headers }),
            fetch('https://api.github.com/repos/skopevoj/cvut-marasty/issues?state=closed&per_page=100', { headers })
        ]);

        if (!contributorsResponse.ok) throw new Error(`Contributors fetch failed: ${contributorsResponse.statusText}`);
        if (!issuesResponse.ok) throw new Error(`Issues fetch failed: ${issuesResponse.statusText}`);

        const contributorsData = await contributorsResponse.json();
        const issuesData = await issuesResponse.json();

        // 1. Process Contributors
        const contributors = contributorsData.map(c => ({
            login: c.login,
            avatar_url: c.avatar_url,
            html_url: c.html_url,
            contributions: c.contributions
        }));

        // 2. Process Issue Reporters (excluding PRs and bots)
        const contributorLogins = new Set(contributors.map(c => c.login));
        const reportersMap = new Map();

        issuesData.forEach(issue => {
            // GitHub API returns PRs as issues too, they have a 'pull_request' key
            if (issue.pull_request) return;

            const user = issue.user;
            if (user && user.type === 'User' && !contributorLogins.has(user.login)) {
                if (!reportersMap.has(user.login)) {
                    reportersMap.set(user.login, {
                        login: user.login,
                        avatar_url: user.avatar_url,
                        html_url: user.html_url
                    });
                }
            }
        });

        const reporters = Array.from(reportersMap.values());

        const outputPath = path.join(__dirname, '../public/contributors.json');
        fs.writeFileSync(outputPath, JSON.stringify({ contributors, reporters }, null, 2));
        console.log(`Successfully saved ${contributors.length} contributors and ${reporters.length} reporters to ${outputPath}`);
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

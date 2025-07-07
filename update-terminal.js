const fs = require('fs');
const axios = require('axios');

// Get the token and username from environment variables
const GITHUB_TOKEN = process.env.GH_TOKEN;
const GITHUB_USERNAME = 'UnityNimit';

// A helper function to truncate text
function truncate(text, length) {
    if (typeof text !== 'string') return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// --- Main Functions ---
async function getLatestActivity() {
    console.log('Fetching latest activity...');
    if (!GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN is not set!');
    }
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/events/public`;
    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        const pushEvent = response.data.find(e => e.type === 'PushEvent');
        if (pushEvent) {
            const commitMsg = pushEvent.payload.commits[0].message;
            const repoName = pushEvent.repo.name;
            const activity = `[COMMIT] ${truncate(commitMsg, 40)} (in ${repoName})`;
            console.log(`Found activity: ${activity}`);
            return activity;
        }
        console.log('No recent public PushEvent found.');
        return "No recent public commits found.";
    } catch (error) {
        console.error('Failed to fetch latest activity:', error.message);
        return 'Could not fetch activity.';
    }
}

async function getStats() {
    console.log('Fetching user stats...');
    if (!GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN is not set!');
    }
    try {
        const url = `https://api.github.com/users/${GITHUB_USERNAME}`;
        const repoUrl = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`;
        const userResponse = await axios.get(url, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
        const repoResponse = await axios.get(repoUrl, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });

        const totalStars = repoResponse.data.reduce((acc, repo) => acc + repo.stargazers_count, 0);
        const totalForks = repoResponse.data.reduce((acc, repo) => acc + repo.forks_count, 0);
        const totalRepos = userResponse.data.public_repos + (userResponse.data.total_private_repos || 0);
        const topLangs = [...new Set(repoResponse.data.map(r => r.language).filter(Boolean))].slice(0, 5).join(', ');

        const stats = {
            name: `${userResponse.data.name || GITHUB_USERNAME} (${userResponse.data.login})`,
            stars: totalStars,
            forks: totalForks,
            repos: `${totalRepos} (${userResponse.data.total_private_repos || 0} private)`,
            langs: topLangs
        };
        console.log('Successfully fetched stats:', stats);
        return stats;
    } catch (error) {
        console.error('Failed to fetch stats:', error.message);
        return { name: 'Error', stars: 'N/A', forks: 'N/A', repos: 'N/A', langs: 'N/A' };
    }
}

async function updateSVG() {
    console.log('Starting SVG update process...');
    const template = fs.readFileSync('terminal_template.svg', 'utf-8');
    
    // Fetch all data in parallel
    const [latestActivity, stats] = await Promise.all([
        getLatestActivity(),
        getStats()
    ]);

    // Replace placeholders
    const updatedSVG = template
        .replace('{{WHOAMI_LINE_1}}', 'Nimit Aryan')
        .replace('{{WHOAMI_LINE_2}}', 'Software Engineer & Creative Technologist')
        .replace('{{LATEST_ACTIVITY}}', latestActivity)
        .replace('{{NEOFETCH_NAME}}', stats.name)
        .replace('{{STARS}}', stats.stars)
        .replace('{{FORKS}}', stats.forks)
        .replace('{{REPOS}}', stats.repos)
        .replace('{{LANGS}}', stats.langs);

    fs.writeFileSync('live_terminal.svg', updatedSVG);
    console.log('Successfully generated live_terminal.svg');
}

updateSVG().catch(error => {
    console.error('An error occurred during the SVG update process:', error);
    process.exit(1);
});
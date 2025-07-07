const fs = require('fs');
const axios = require('axios');

const GITHUB_TOKEN = process.env.GH_TOKEN;
const GITHUB_USERNAME = 'UnityNimit';

// A helper function to truncate text
function truncate(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

async function getLatestActivity() {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/events/public`;
    const response = await axios.get(url, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const pushEvent = response.data.find(e => e.type === 'PushEvent');
    if (pushEvent) {
        const commitMsg = pushEvent.payload.commits[0].message;
        const repoName = pushEvent.repo.name;
        return `[COMMIT] ${truncate(commitMsg, 40)} (in ${repoName})`;
    }
    return "No recent public commits found.";
}

async function getStats() {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}`;
    const repoUrl = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`;
    const userResponse = await axios.get(url, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
    const repoResponse = await axios.get(repoUrl, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });

    const totalStars = repoResponse.data.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    const totalForks = repoResponse.data.reduce((acc, repo) => acc + repo.forks_count, 0);
    const totalRepos = userResponse.data.public_repos + userResponse.data.private_repos;
    const topLangs = [...new Set(repoResponse.data.map(r => r.language).filter(Boolean))].slice(0, 5).join(', ');

    return {
        name: `${userResponse.data.name} (${userResponse.data.login})`,
        stars: totalStars,
        forks: totalForks,
        repos: `${totalRepos} (${userResponse.data.private_repos} private)`,
        langs: topLangs
    };
}


async function updateSVG() {
    const template = fs.readFileSync('terminal_template.svg', 'utf-8');
    
    const latestActivity = await getLatestActivity();
    const stats = await getStats();

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

updateSVG();
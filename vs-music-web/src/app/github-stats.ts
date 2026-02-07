
export interface GitHubStats {
    stars: number | null;
    forks: number | null;
    issues: number | null;
    version: string | null;
}

export async function getGitHubStats(): Promise<GitHubStats> {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; CodersHubBot/1.0)',
            'Accept': 'application/vnd.github.v3+json'
        };

        // Fetch repo details for stars, forks, issues
        const repoRes = await fetch('https://api.github.com/repos/codershubinc/vs-music', {
            next: { revalidate: 3600 },
            headers
        });


        let stars = null;
        let forks = null;
        let issues = null;

        if (repoRes.ok) {
            const data = await repoRes.json();
            console.log("Github  stats", data);
            stars = data.stargazers_count;
            forks = data.forks_count;
            issues = data.open_issues_count;
        }

        // Fetch latest release for version
        let version = null;
        const releaseRes = await fetch('https://api.github.com/repos/codershubinc/vs-music/releases/latest', {
            next: { revalidate: 3600 },
            headers
        });

        if (releaseRes.ok) {
            const data = await releaseRes.json();
            version = data.tag_name;
        } else {
            // Fallback to tags
            const tagsRes = await fetch('https://api.github.com/repos/codershubinc/vs-music/tags', {
                next: { revalidate: 3600 },
                headers
            });
            if (tagsRes.ok) {
                const data = await tagsRes.json();
                if (data.length > 0) {
                    version = data[0].name;
                }
            }
        }

        return { stars, forks, issues, version };
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        return { stars: null, forks: null, issues: null, version: null };
    }
}

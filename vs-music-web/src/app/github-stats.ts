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

        // Fetch repo details for stars, forks, issues without cache
        const repoRes = await fetch('https://api.github.com/repos/codershubinc/vs-music', {
            cache: 'no-store',
            headers
        });

        let stars = null;
        let forks = null;
        let issues = null;

        if (repoRes.ok) {
            const data = await repoRes.json();
            stars = data.stargazers_count;
            forks = data.forks_count;
            issues = data.open_issues_count;
        }

        let version: string | null = null;

        // 1. Fetch package.json from main branch for real-time version without cache
        try {
            const pkgRes = await fetch('https://raw.githubusercontent.com/codershubinc/vs-music/main/package.json', {
                cache: 'no-store',
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CodersHubBot/1.0)' }
            });
            if (pkgRes.ok) {
                const pkgData = await pkgRes.json();
                if (pkgData.version) {
                    version = `v${pkgData.version}`;
                }
            }
        } catch (pkgErr) {
            console.error('Error fetching package.json version:', pkgErr);
        }

        // 2. Fallback to latest GitHub release
        if (!version) {
            const releaseRes = await fetch('https://api.github.com/repos/codershubinc/vs-music/releases/latest', {
                cache: 'no-store',
                headers
            });

            if (releaseRes.ok) {
                const data = await releaseRes.json();
                version = data.tag_name;
            } else {
                // 3. Fallback to git tags
                const tagsRes = await fetch('https://api.github.com/repos/codershubinc/vs-music/tags', {
                    cache: 'no-store',
                    headers
                });
                if (tagsRes.ok) {
                    const data = await tagsRes.json();
                    if (data.length > 0) {
                        version = data[0].name;
                    }
                }
            }
        }

        return { stars, forks, issues, version };
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        return { stars: null, forks: null, issues: null, version: null };
    }
}

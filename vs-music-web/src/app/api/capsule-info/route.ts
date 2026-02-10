import { NextResponse } from 'next/server';
import { getInstallCount } from '@/app/scraper';
import { getGitHubStats } from '@/app/github-stats';

export async function GET() {
    try {
        const [installs, githubStats] = await Promise.all([
            getInstallCount(),
            getGitHubStats()
        ]);

        return NextResponse.json({
            installs,
            ...githubStats
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('Error fetching capsule info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch capsule info' },
            { 
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    }
}

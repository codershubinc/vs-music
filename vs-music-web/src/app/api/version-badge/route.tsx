import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { getGitHubStats } from '@/app/github-stats';

function generateSVG(version: string): string {
    const label = 'version';
    const labelWidth = Math.round(label.length * 6.5 + 16);
    const valueWidth = Math.round(version.length * 7.5 + 16);
    const totalWidth = labelWidth + valueWidth;
    const height = 20;

    const lx = Math.round(labelWidth / 2);
    const vx = labelWidth + Math.round(valueWidth / 2);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="#007acc"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${lx + 0.5}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${lx}" y="14">${label}</text>
    <text x="${vx + 0.5}" y="15" fill="#010101" fill-opacity=".3">${version}</text>
    <text x="${vx}" y="14">${version}</text>
  </g>
</svg>`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') ?? 'svg';

    const { version: raw } = await getGitHubStats();
    const version = raw ?? 'unknown';

    if (format === 'png') {
        const labelWidth = 68;
        const valueWidth = Math.max(52, version.length * 9 + 16);
        const totalWidth = labelWidth + valueWidth;
        const height = 28;

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        width: totalWidth,
                        height,
                        borderRadius: 4,
                        overflow: 'hidden',
                        fontFamily: 'DejaVu Sans, Verdana, Geneva, sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: labelWidth,
                            height,
                            background: '#555',
                            color: '#fff',
                        }}
                    >
                        version
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: valueWidth,
                            height,
                            background: '#007acc',
                            color: '#fff',
                        }}
                    >
                        {version}
                    </div>
                </div>
            ),
            { width: totalWidth, height }
        );
    }

    // Default: SVG
    const svg = generateSVG(version);
    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
        },
    });
}

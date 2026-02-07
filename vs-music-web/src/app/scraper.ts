
export async function getInstallCount() {
    try {
        const res = await fetch('https://marketplace.visualstudio.com/items?itemName=codershubinc.music', {
            next: { revalidate: 3600 }, // Cache for 1 hour if using Next.js App Router caching
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error(`Failed to fetch page: ${res.status} ${res.statusText}`);
            return null;
        }

        const html = await res.text();

        // Strategy 1: Look for the specific "installs" text which usually appears near the top
        // Regex matches: "386 installs" or "1,234 installs"
        // Using a refined regex that looks for the number preceding "installs"
        const match = html.match(/\b([\d,]+)\s+installs\b/i);

        if (match && match[1]) {
            const numberStr = match[1].replace(/,/g, '');
            const count = parseInt(numberStr, 10);
            return isNaN(count) ? null : count;
        }

        return null;
    } catch (error) {
        console.error('Error scraping install count:', error);
        return null;
    }
}

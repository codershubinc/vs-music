import { ArrowLeft, Github } from 'lucide-react';
import Link from 'next/link';
import { StarBadge, VersionBadge } from '@/components/badges';

interface GitHubStats {
    stars: number | null;
    version: string | null;
}

interface NavigationBarProps {
    ghStats: GitHubStats;
    gitRepoUrl: string;
}

export default function NavigationBar({ ghStats, gitRepoUrl }: NavigationBarProps) {
    return (
        <nav className="fixed w-full z-50 border-b border-[#1a1a1a]/30 bg-black/20 backdrop-blur-2xl">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="https://codershubinc.com/" target='_blank' className="flex items-center gap-2 hover:text-white transition group">
                    <span className="font-mono text-sm">codershubinc</span>
                </Link>
                <div className="flex items-center gap-3 text-sm font-medium">
                    {ghStats.stars !== null && (
                        <Link href={gitRepoUrl} target="_blank" className="hidden md:block hover:scale-105 transition-transform">
                            <StarBadge count={ghStats.stars} />
                        </Link>
                    )}
                    {ghStats.version && (
                        <Link href={gitRepoUrl + "/releases"} target="_blank" className="hidden md:block">
                            <VersionBadge version={ghStats.version} />
                        </Link>
                    )}
                    <a href={gitRepoUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition">
                        <Github size={22} />
                    </a>
                </div>
            </div>
        </nav>
    );
}

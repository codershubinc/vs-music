import { Github } from 'lucide-react';
import Link from 'next/link';
import { StarBadge, VersionBadge } from '@/components/badges';
import Image from 'next/image';


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

                    <a
                        href="https://github.com/codershubinc"
                        target="_blank"
                        className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-[#007acc]/30 hover:bg-[#007acc]/10 transition-all group"
                    >
                        <Image
                            width={16}
                            height={16}
                            src="https://github.com/codershubinc.png"
                            alt="Profile"
                            className="w-4 h-4 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="text-xs font-mono text-[#888] group-hover:text-white transition-colors">@codershubinc</span>
                    </a>

                    <div className="w-px h-4 bg-white/10 hidden md:block"></div>

                    <a href={gitRepoUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition">
                        <Github size={22} />
                    </a>
                </div>
            </div>
        </nav>
    );
}

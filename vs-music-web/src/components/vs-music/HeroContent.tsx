import { Download } from 'lucide-react';
import Link from 'next/link';
import CopyButton from '@/components/CopyButton';
import { CategoryBadge, InstallsBadge, StarBadge } from '@/components/badges';

interface HeroContentProps {
    installCount: number | null;
    stars: number | null;
    gitRepoUrl: string;
}

export default function HeroContent({ installCount, stars, gitRepoUrl }: HeroContentProps) {
    return (
        <div className="flex flex-col items-start z-10">
            <div className="flex flex-wrap items-center gap-3 mb-8">
                <CategoryBadge label="VS Code Extension" />
                {installCount && <InstallsBadge count={installCount} />}
                {stars !== null && (
                    <Link href={gitRepoUrl} target="_blank" className="hover:scale-105 transition-transform">
                        <StarBadge count={stars} />
                    </Link>
                )}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
                Code to the <br />
                {/* VS Code Signature Gradient */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007acc] to-[#0e639c]">
                    Rhythm.
                </span>
            </h1>

            <p className="text-lg text-[#b0b0b0] max-w-lg mb-10 leading-relaxed">
                The only <span className="text-white font-medium">VS Code extension</span> that puts your Spotify & Apple Music playlists directly into your sidebar. No context switching required.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <a
                    href="https://marketplace.visualstudio.com/items?itemName=codershubinc.music"
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-[#007acc] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#0e639c] transition-all w-full sm:w-auto"
                >
                    <Download size={18} />
                    Install Now
                </a>
                <div className="flex items-center justify-between gap-3 px-4 py-4 rounded-lg text-[#b0b0b0] font-mono text-sm w-full sm:w-auto border border-[#1a1a1a] bg-[#161616] hover:bg-[#1c1c1c] transition-colors">
                    <span className="select-all">ext install codershubinc.music</span>
                    <CopyButton text="ext install codershubinc.music" />
                </div>
            </div>
        </div>
    );
}

import HeroContent from './HeroContent';
import HeroImage from './HeroImage';
import ImageMarquee from '@/components/ImageMarquee';

interface GitHubStats {
    stars: number | null;
    version: string | null;
}

interface HeroSectionProps {
    installCount: number | null;
    ghStats: GitHubStats;
    gitRepoUrl: string;
}

export default function HeroSection({ installCount, ghStats, gitRepoUrl }: HeroSectionProps) {
    return (
        <section className="pt-40 pb-20 px-6 relative">
            {/* VS Code Glow - A massive blue spotlight behind the text */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#007acc] opacity-5 blur-[150px] -z-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                {/* LEFT: Content */}
                <HeroContent
                    installCount={installCount}
                    stars={ghStats.stars}
                    gitRepoUrl={gitRepoUrl}
                />

                {/* RIGHT: Blended Dashboard Preview */}
                <HeroImage />
            </div>

            {/* Marquee */}
            <div className="mt-32 border-t border-[#1a1a1a] pt-12">
                <p className="text-center text-xs font-mono text-[#6e6e6e] mb-8 uppercase tracking-widest">
                    Visual Tour
                </p>
                <ImageMarquee />
            </div>
        </section>
    );
}

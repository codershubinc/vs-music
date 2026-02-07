import { Zap, HardDrive, Cpu, Activity, GitCommit } from 'lucide-react';

interface GitHubStats {
    stars: number | null;
    forks: number | null;
    issues: number | null;
    version: string | null;
}

const stats = [
    {
        icon: Zap,
        label: "Faster Loading",
        value: "73%",
        desc: "Reduced artwork load time"
    },
    {
        icon: HardDrive,
        label: "Smart Caching",
        value: "80%",
        desc: "Less disk usage via LRU cache"
    },
    {
        icon: Cpu,
        label: "Cache Hits",
        value: "+25%",
        desc: "Improved hit rate efficiency"
    }
];

export default function InfoSection({ ghStats }: { ghStats: GitHubStats }) {
    return (
        <section className="py-24 border-y border-[#1a1a1a] bg-[#0a0a0a] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-[#0a0a0a] to-[#0a0a0a] opacity-50"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Music that respects your resources.</h2>
                        <p className="text-[#888] text-lg leading-relaxed mb-8">
                            Modern music players are bloated web apps wrapped in Electron. 
                            VS Music is built to be invisible until you need it, sipping resources while delivering high-quality audio playback directly from your local drive.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center gap-2 text-[#007acc] mb-2">
                                        <stat.icon size={18} />
                                        <span className="text-xs font-mono uppercase tracking-wider font-semibold">{stat.label}</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                    <p className="text-[#666] text-xs">{stat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -inset-4 bg-linear-to-r from-[#007acc] to-[#005a9e] opacity-20 blur-2xl rounded-2xl"></div>
                        <div className="relative bg-[#111] border border-[#222] rounded-xl p-8 space-y-6">
                            <div className="flex items-center gap-4 border-b border-[#222] pb-6">
                                <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center">
                                    <code className="text-[#007acc] font-bold">VS</code>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Native Integration</h3>
                                    <p className="text-[#666] text-sm">Lives where you code</p>
                                </div>
                            </div>
                            <div className="space-y-4 font-mono text-sm text-[#888]">
                                <div className="flex justify-between">
                                    <span>Latest Version</span>
                                    <span className="text-green-500">{ghStats?.version || 'v0.2.0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Open Issues</span>
                                    <span className="text-[#007acc]">{ghStats?.issues || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Startup Time</span>
                                    <span className="text-green-500">Instant</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-[#222]">
                                    <span>Dev Time</span>
                                    <a href="https://wakatime.com/badge/user/c8cd0c53-219b-4950-8025-0e666e97e8c8/project/a68f0e8f-e56d-4815-8c99-1e6c2d6a27c8" target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
                                        <img src="https://wakatime.com/badge/user/c8cd0c53-219b-4950-8025-0e666e97e8c8/project/a68f0e8f-e56d-4815-8c99-1e6c2d6a27c8.svg" alt="wakatime" className="h-[20px]" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

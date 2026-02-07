import Link from 'next/link';
import { Github, Twitter, Mail, Terminal, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8 mt-auto">
            <div className="max-w-7xl mx-auto px-6">

                {/* Top Section: Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="md:col-span-2 space-y-4">
                        <a href="https://codershubinc.com" target="_blank" className="flex items-center gap-2 text-white font-bold tracking-tight text-xl group w-fit">
                            <div className="p-1.5 rounded bg-white/5 group-hover:bg-[#007acc]/20 transition-colors">
                                <Terminal size={18} className="text-[#007acc]" />
                            </div>
                            <span>CodersHubInc</span>
                        </a>
                        <p className="text-[#888] text-sm leading-relaxed max-w-sm">
                            Building high-performance developer tools and self-hosted infrastructure.
                            Open source by default.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-mono text-[#666] pt-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                            All Systems Operational
                        </div>
                    </div>

                    {/* Projects Column */}
                    <div>
                        <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Ecosystem</h3>
                        <ul className="space-y-4 text-sm text-[#888]">
                            <li>
                                <Link href="/projects/vs-music" className="hover:text-[#007acc] transition-colors flex items-center gap-2">
                                    VS Music
                                </Link>
                            </li>
                            <li>
                                <a href="https://orbit.codershubinc.com" target="_blank" className="hover:text-[#007acc] transition-colors flex items-center gap-2 group">
                                    Orbit
                                    <ArrowUpRight size={12} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                </a>
                            </li>
                            <li>
                                <a href="https://quazaar.codershubinc.com" target="_blank" className="hover:text-[#007acc] transition-colors flex items-center gap-2 group">
                                    Quazaar
                                    <ArrowUpRight size={12} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Connect Column */}
                    <div>
                        <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Connect</h3>
                        <div className="flex gap-4">
                            <a href="https://github.com/codershubinc" target="_blank" className="p-2 rounded-full bg-white/5 text-[#888] hover:bg-[#007acc] hover:text-white transition-all">
                                <Github size={18} />
                            </a>
                            <a href="https://twitter.com/codershubinc" target="_blank" className="p-2 rounded-full bg-white/5 text-[#888] hover:bg-[#1DA1F2] hover:text-white transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="mailto:ingleswapnil2004@gmail.com" className="p-2 rounded-full bg-white/5 text-[#888] hover:bg-white hover:text-black transition-all">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#666] font-mono">
                    <p>&copy; {new Date().getFullYear()} <a href="https://codershubinc.com" target="_blank" className="hover:text-[#007acc] transition-colors">CodersHubInc</a> </p>
                    <div className="flex items-center gap-1">
                        <span>Made with</span>
                        <Heart size={10} className="text-red-500 fill-red-500" />
                        <span>By Swapnil Ingle</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
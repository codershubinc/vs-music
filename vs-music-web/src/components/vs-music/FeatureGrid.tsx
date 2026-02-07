import { Mic2, Command, Music, LucideIcon } from 'lucide-react';

interface Feature {
    icon: LucideIcon;
    title: string;
    desc: string;
    color: string;
}

const features: Feature[] = [
    {
        icon: Mic2,
        title: "Webview Powered",
        desc: "React-based UI rendered natively in VS Code with smooth animations.",
        color: "from-[#007acc] to-[#005a9e]"
    },
    {
        icon: Command,
        title: "Command Palette",
        desc: "Control playback via Ctrl+Shift+P without touching the mouse.",
        color: "from-[#0e639c] to-[#007acc]"
    },
    {
        icon: Music,
        title: "Queue System",
        desc: "Drag & rop queue management for your coding sessions.",
        color: "from-[#005a9e] to-[#007acc]"
    }
];

export default function FeatureGrid() {
    return (
        <section className="py-24 px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent -z-10"></div>

            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for Developers</h2>
                    <p className="text-[#6e6e6e] max-w-2xl mx-auto">Every feature is designed to keep you in the flow state</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <div key={i} className="group relative p-8 rounded-2xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#007acc] transition-all hover:scale-[1.02]">
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                            <div className="relative">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} opacity-10 flex items-center justify-center mb-6 group-hover:opacity-20 transition-all group-hover:scale-110`}>
                                    <feature.icon size={26} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-[#b0b0b0] leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

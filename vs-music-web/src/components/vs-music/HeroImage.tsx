import Image from 'next/image';

export default function HeroImage() {
    return (
        <div className="relative lg:scale-110 lg:translate-x-8 w-auto h-auto">
            {/* Glow Effect Behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[700px] bg-gradient-to-br from-[#007acc]/15 to-[#0e639c]/10 blur-[120px] -z-10"></div>

            {/* Image with Fade Mask */}
            <div className="relative">
                <Image
                    src="/vs-music-demo.png"
                    alt="Main Interface"
                    width={1400}
                    height={900}
                    className="w-full h-auto"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
                        maskComposite: 'intersect',
                        WebkitMaskComposite: 'source-in'
                    }}
                    priority
                />
                {/* Subtle overlay for integration */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-50 pointer-events-none"></div>
            </div>
        </div>
    );
}

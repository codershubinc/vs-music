'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const images = [
  "/vs-music-demo.png",
  "/vs-music-demo-deep.png",
  "/vs-music-demo.png",
  "/vs-music-demo-deep.png"
];

export default function ImageMarquee() {
  return (
    <div className="w-full overflow-hidden py-12 relative fade-mask">
      {/* Gradient masks for edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#1e1e1e] to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#1e1e1e] to-transparent z-10"></div>

      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: "-50%" }}
        initial={{ x: "0%" }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 30
        }}
        whileHover={{ animationPlayState: "paused" }}
      >
        {/* Render images twice to ensure seamless loop */}
        {[...images, ...images].map((src, index) => (
          <div
            key={index}
            className="relative w-[300px] md:w-[500px] h-[200px] md:h-[300px] rounded-xl overflow-hidden border border-[#333] shadow-2xl flex-shrink-0 group"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-500 z-10"></div>
            <Image
              src={src}
              alt={`Gallery Image ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

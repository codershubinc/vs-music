import React from 'react';
import { getInstallCount } from './scraper';
import { getGitHubStats } from './github-stats';
import BackgroundGrid from '@/components/vs-music/BackgroundGrid';
import NavigationBar from '@/components/vs-music/NavigationBar';
import HeroSection from '@/components/vs-music/HeroSection';
import FeatureGrid from '@/components/vs-music/FeatureGrid';
import Footer from '@/components/vs-music/Footer';
import InfoSection from '@/components/vs-music/InfoSection';

export default async function VSMusicPage() {
  const [installCount, ghStats] = await Promise.all([
    getInstallCount(),
    getGitHubStats()
  ]);
  const gitRepoUrl = "https://github.com/codershubinc/vs-music";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#b0b0b0] font-sans selection:bg-[#007acc] selection:text-white relative">
      <BackgroundGrid />
      <NavigationBar ghStats={ghStats} gitRepoUrl={gitRepoUrl} />
      <HeroSection installCount={installCount} ghStats={ghStats} gitRepoUrl={gitRepoUrl} />
      <InfoSection ghStats={ghStats} />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
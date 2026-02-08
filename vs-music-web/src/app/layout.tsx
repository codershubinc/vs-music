import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "VS Music - Native Music Controls for VS Code",
  description: "Control Spotify, VLC, and system media directly from VS Code. Lightweight, native integration for Windows & Linux with beautiful artwork display.",
  applicationName: "VS Music",
  authors: [{ name: "Swapnil Ingle", url: "https://codershubinc.com" }],
  keywords: ["vscode", "extension", "music", "spotify", "vlc", "playerctl", "media-controls", "developer-tools", "windows", "linux"],
  creator: "Swapnil Ingle",
  publisher: "CodersHubInc",
  metadataBase: new URL("https://vsmusic.codershubinc.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vsmusic.codershubinc.com",
    title: "VS Music - Native Music Controls for VS Code",
    description: "Stay in flow. Control your music without leaving your editor. Native performance for Windows & Linux.",
    siteName: "VS Music",
    images: [
      {
        url: "/vs-music-demo-deep.png",
        width: 1200,
        height: 630,
        alt: "VS Music Extension Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VS Music - Native Music Controls for VS Code",
    description: "Control Spotify, VLC, and system media directly from VS Code. Native performance for Windows & Linux.",
    creator: "@codershubinc",
    images: ["/vs-music-demo-deep.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-[#0a0a0a]`}>
        {children}
      </body>
    </html>
  );
}

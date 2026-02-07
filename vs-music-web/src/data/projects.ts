import { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "orbit",
    title: "Orbit",
    slug: "orbit",
    description: "Self-hosted deployment monitoring server written in Go. Tracks system health, uptime, and deployment status via a lightweight agent.",
    techStack: ["Go", "Linux", "Systemd", "Concurrency"],
    liveUrl: "https://orbit.codershubinc.com",
    githubUrl: "https://github.com/codershubinc/orbit",
    featured: true,
  },
  {
    id: "vsmusic",
    title: "VS Music",
    slug: "vs-music",
    description: "VS Code extension to control Spotify and Apple Music playback directly from the editor status bar. 500+ users.",
    techStack: ["TypeScript", "VS Code API", "IPC"],
    liveUrl: "https://vsmusic.codershubinc.com",
    githubUrl: "https://github.com/codershubinc/vs-music",
    featured: true,
  },
  {
    id: "quazaar",
    title: "Quazaar",
    slug: "quazaar",
    description: "Unified media control system bridging Linux and Windows audio APIs into a single Go-based control surface.",
    techStack: ["Go", "C#", "Cross-Platform", "Backend"],
    liveUrl: "https://quazaar.codershubinc.com",
    githubUrl: "https://github.com/codershubinc/quazaar",
    featured: true,
  }
];

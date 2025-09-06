# VS Music Extension for VS Code

![VS Music Icon](https://img.shields.io/badge/VS%20Code-Music%20Extension-blue?logo=visual-studio-code.svg)
![Linux](https://img.shields.io/badge/Linux-Compatible-green?logo=linux.svg)
![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Publisher](https://img.shields.io/badge/Publisher-codershubinc-orange.svg)
![Version](https://img.shields.io/badge/Version-0.1.5%20stable-blue.svg)

A Visual Studio Code extension that displays currently playing music information and provides playback controls directly in your editor. Perfect for Linux developers who want to stay in their coding flow while managing their music.

> **✅ STABLE LINUX RELEASE (v0.1.5)**: Core playback, artwork, and status integration are stable for Linux. Minor enhancements & cross‑platform support are upcoming.
>
> **🐧 LINUX ONLY**: Currently supports Linux systems only. Windows & macOS support coming soon.

## 📸 Screenshots

![VS Music Extension in Action](ss.png)
![VS Music Extension in Action](ss0.png)

_The extension showing current track information in VS Code with the music player panel and status bar integration_

## ✨ Features

- **Status Bar Integration**: Shows current track info (title, artist) in VS Code's status bar
- **Music Explorer Panel**: Dedicated panel in the Explorer sidebar with music controls
- **Playback Controls**: Play/pause, next/previous track controls
- **Real-time Updates**: Automatically updates when tracks change
- **Album Artwork Display**: Shows album artwork in the music panel when available
- **Side-by-side Layout**: Clean layout with artwork and track info displayed together
- **Scrolling Text Animation**: Long track titles and artist names flow horizontally for full readability
- **Interactive Text Control**: Hover over text to pause scrolling animation
- **Corner Widget**: Optional floating widget for quick access
- **Configurable Display**: Customize what information is shown and where

## 🐧 Linux Compatibility

> **⚠️ Platform Notice**: This extension currently supports **Linux only**. Windows and macOS support is in development.

This extension is specifically designed for Linux systems and uses `playerctl` to communicate with MPRIS-compatible media players.

### Supported Music Players

The following Linux music players are supported through MPRIS/playerctl:

- **Spotify**
- **VLC Media Player**
- **Rhythmbox**
- **Audacious**
- **Clementine**
- **Strawberry**
- **Amarok**
- **Banshee**
- **Totem**
- **mpv** (with MPRIS script)
- **Chromium/Chrome** (when playing media)
- **Firefox** (when playing media)
- And any other MPRIS-compatible player

## 📦 Installation

### Prerequisites

> **🚨 Critical Requirement**: You **MUST** have `playerctl` installed on your Linux system for this extension to work properly.
>
> **Not sure if you have it?** Run `playerctl --version` in your terminal to check.

#### Install playerctl

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install playerctl
```

**Fedora/CentOS/RHEL:**

```bash
sudo dnf install playerctl
# or for older versions:
sudo yum install playerctl
```

**Arch Linux:**

```bash
sudo pacman -S playerctl
```

**openSUSE:**

```bash
sudo zypper install playerctl
```

**From Source (if not available in repos):**

```bash
git clone https://github.com/altdesktop/playerctl.git
cd playerctl
meson builddir
cd builddir
ninja
sudo ninja install
```

### Verify Installation

Test that playerctl works with your music player:

```bash
# Check if playerctl is installed
playerctl --version

# Test with your music player (start playing music first)
playerctl metadata
playerctl status
```

### Install the Extension

1. **From VS Code Marketplace**:

   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "VS Music" by **codershubinc**
   - Click Install

2. **From VSIX file**:

   - Download the `music-0.1.5.vsix` file from [releases](https://github.com/codershubinc/vs-music/releases)
   - Open VS Code
   - Press Ctrl+Shift+P and type "Extensions: Install from VSIX"
   - Select the downloaded .vsix file

3. **From GitHub**:
   - Visit the [VS Music repository](https://github.com/codershubinc/vs-music)
   - Download the latest release

## 🚀 Usage

1. **Start your music player** (Spotify, VLC, etc.)
2. **Begin playing music**
3. The extension will automatically detect and display track information

### Available Commands

Access these commands via the Command Palette (Ctrl+Shift+P):

- `Music: Toggle Widget` - Show/hide the music widget
- `Music: Toggle Corner Widget` - Show/hide corner widget
- `Music: Play/Pause` - Toggle playback
- `Music: Next Track` - Skip to next track
- `Music: Previous Track` - Go to previous track
- `Music: Show Music Panel` - Open the music panel
- `Music: Refresh` - Refresh music information

### UI Components

#### Status Bar

- Shows current track information in the status bar
- Click to play/pause
- Configurable position (left/right)

#### Music Explorer Panel

- Located in the Explorer sidebar
- Shows detailed track information with album artwork
- Features smooth scrolling text animation for long titles and artist names
- Hover over text to pause scrolling for better readability
- Includes playback controls
- Features a clean side-by-side layout with artwork and track details
- Automatically caches artwork for better performance

#### Corner Widget

- Optional floating widget
- Quick access to controls
- Minimal and unobtrusive

## ⚙️ Configuration

Configure the extension through VS Code settings (File → Preferences → Settings, then search for "music"):

```json
{
  "music.enableStatusBar": true,
  "music.statusBarPosition": "right",
  "music.statusBarPriority": 100,
  "music.updateInterval": 1000,
  "music.showAlbumArt": true,
  "music.enableArtworkCaching": true,
  "music.maxTitleLength": 30
}
```

### Settings Reference

| Setting                      | Type    | Default   | Description                                    |
| ---------------------------- | ------- | --------- | ---------------------------------------------- |
| `music.enableStatusBar`      | boolean | `true`    | Show music info in status bar                  |
| `music.statusBarPosition`    | string  | `"right"` | Position of music info (`"left"` or `"right"`) |
| `music.statusBarPriority`    | number  | `100`     | Priority of music status bar item              |
| `music.updateInterval`       | number  | `1000`    | Update interval in milliseconds                |
| `music.showAlbumArt`         | boolean | `true`    | Show album art in music panel                  |
| `music.enableArtworkCaching` | boolean | `true`    | Cache album artwork for better performance     |
| `music.maxTitleLength`       | number  | `30`      | Maximum length of song title in status bar     |

## 🔧 Troubleshooting

> **💡 Quick Fix**: 90% of issues are solved by installing `playerctl` and restarting VS Code!

### Common Issues

#### ❌ "playerctl not available" message

> **🔴 This is the most common issue!**

- **Solution**: Install playerctl using your distribution's package manager (see Installation section)
- **Verify**: Run `playerctl --version` in terminal
- **Expected Output**: Should show version number like `playerctl v2.4.1`

#### ❌ Extension doesn't detect music

- **Check**: Ensure your music player supports MPRIS
- **Test**: Run `playerctl metadata` while music is playing
- **Restart**: Try restarting VS Code after starting your music player
- **Player List**: Run `playerctl -l` to see available players

#### ❌ No controls working

- **Verify**: Test playerctl commands manually:
  ```bash
  playerctl play-pause
  playerctl next
  playerctl previous
  ```

#### Track info not updating

- **Check**: Increase the update interval in settings if on a slower system
- **Restart**: Restart both your music player and VS Code

### Debug Information

To get debug information:

1. Open VS Code Developer Tools (Help → Toggle Developer Tools)
2. Check the Console tab for VS Music extension logs
3. Look for error messages related to playerctl

### Getting Help

If you encounter issues:

1. Check that playerctl works with your music player
2. Verify your music player supports MPRIS
3. Check VS Code's Developer Console for errors
4. Create an issue with your system info:
   - Linux distribution and version
   - Music player and version
   - playerctl version
   - Error messages from console

## 🎵 Supported Formats

The extension works with any audio format supported by your music player, including:

- MP3, FLAC, OGG, AAC, WAV
- Streaming services (Spotify, YouTube Music in browser)
- Internet radio streams
- Podcasts and audiobooks

## 🤝 Contributing

Contributions are welcome! This extension is specifically designed for Linux systems.

### Development Setup

1. Clone the repository: `git clone https://github.com/codershubinc/vs-music.git`
2. Navigate to music directory: `cd vs-music/music`
3. Install dependencies: `bun install`
4. Open in VS Code
5. Press F5 to launch Extension Development Host
6. Test with your favorite Linux music player

### Building

```bash
# Compile TypeScript
bun run compile

# Package extension
bun run package

# Create VSIX
bun run build-vsix
```

## 👨‍💻 Author & Connect

**Swapnil Ingle** ([@codershubinc](https://github.com/codershubinc))

### 🌐 Find me on

[![GitHub](https://img.shields.io/badge/GitHub-codershubinc-181717?style=for-the-badge&logo=github)](https://github.com/codershubinc)
[![Twitter](https://img.shields.io/badge/Twitter-@codershubinc-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/codershubinc)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Swapnil%20Ingle-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/swapnil-ingle)
[![Instagram](https://img.shields.io/badge/Instagram-@codershubinc-E4405F?style=for-the-badge&logo=instagram)](https://instagram.com/codershubinc)
[![YouTube](https://img.shields.io/badge/YouTube-CodersHub-FF0000?style=for-the-badge&logo=youtube)](https://youtube.com/@codershubinc)

### 📬 Project Links

- **Repository**: <https://github.com/codershubinc/vs-music>
- **Issues & Support**: <https://github.com/codershubinc/vs-music/issues>
- **VS Code Marketplace**: [VS Music Extension](https://marketplace.visualstudio.com/items?itemName=codershubinc.music)

## 📈 Marketplace Information

- **Extension Name**: VS Music
- **Publisher**: codershubinc
- **Version**: 0.1.5
- **Category**: Other
- **License**: MIT
- **Engine**: VS Code ^1.103.0

## 🏷️ Keywords

`music`, `player`, `spotify`, `vlc`, `linux`, `playerctl`, `mpris`, `status-bar`, `media-control`, `audio`, `playback`, `music-info`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [playerctl](https://github.com/altdesktop/playerctl) - The backbone that makes this extension possible
- The MPRIS specification for standardized media player control
- VS Code Extension API documentation
- The Linux audio community

---

### Enjoy coding with your favorite tunes! 🎶

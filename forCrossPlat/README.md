# Music Player - Cross Platform

A VS Code extension that displays currently playing music information in the status bar and provides a dedicated music panel. Works across Windows, macOS, and Linux platforms.

## Features

- 🎵 **Real-time music display** - Shows currently playing track information
- 🖥️ **Cross-platform support** - Works on Windows, macOS, and Linux
- 📱 **Multiple UI components** - Status bar item, corner widget, and dedicated panel
- 🎮 **Media controls** - Play/pause, next, and previous track controls
- ⚙️ **Configurable** - Customize update intervals and UI visibility

## Supported Music Players

### Windows

- Uses Windows Media Control API to detect any media playing through the system
- Supports Spotify, Apple Music, YouTube Music, Windows Media Player, and more

### macOS

- Uses AppleScript to communicate with:
  - Apple Music
  - Spotify
  - iTunes

### Linux

- Uses `playerctl` to communicate with MPRIS-compatible players:
  - Spotify
  - VLC
  - Rhythmbox
  - And many more

## Prerequisites

### Linux Users

Install `playerctl` using your package manager:

```bash
# Ubuntu/Debian
sudo apt install playerctl

# Fedora
sudo dnf install playerctl

# Arch Linux
sudo pacman -S playerctl

# Snap (universal)
sudo snap install playerctl
```

### Windows Users

No additional setup required - uses built-in Windows Media Control API.

### macOS Users

No additional setup required - uses built-in AppleScript functionality.

## Installation

1. Install from VS Code Marketplace (when published)
2. Or install from VSIX file
3. Or run in development mode (see Development section)

## Usage

### Commands

- `Music: Show Corner Widget` - Display music widget in corner
- `Music: Hide Corner Widget` - Hide corner widget
- `Music: Show Music Panel` - Open dedicated music panel
- `Music: Play/Pause` - Toggle playback
- `Music: Next Track` - Skip to next track
- `Music: Previous Track` - Go to previous track

### Configuration

Configure the extension through VS Code settings:

```json
{
  "music.updateInterval": 1000,
  "music.showInStatusBar": true,
  "music.enableCornerWidget": true,
  "music.platform.windows.useMediaControl": true,
  "music.platform.macos.useAppleScript": true,
  "music.platform.linux.usePlayerctl": true
}
```

## Development

### Building

```bash
# Install dependencies
bun install

# Build extension
bun run compile

# Watch mode for development
bun run watch

# Package for production
bun run package
```

### Testing

1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VS Code window

### Project Structure

```
src/
├── extension.ts          # Extension entry point
├── musicController.ts    # Main controller coordinating UI components
└── musicService.ts       # Cross-platform music detection service
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across platforms if possible
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Linux: "playerctl not found"

Install playerctl using your package manager (see Prerequisites section).

### macOS: Permission issues

Grant VS Code permission to control other applications in System Preferences > Security & Privacy > Privacy > Automation.

### Windows: Media detection not working

Ensure your music player supports Windows Media Control API. Most modern players do.

### General: No music detected

- Ensure music is actually playing
- Check that your player is supported
- Verify extension configuration settings
- Check VS Code Developer Console for error messages

## Platform-Specific Notes

### Windows

The extension uses PowerShell to access Windows Media Control API. This should work with any application that properly reports media information to Windows.

### macOS

AppleScript support varies by application. Spotify and Apple Music have the best support.

### Linux

Requires MPRIS-compatible media players and playerctl installed. Most modern Linux media players support MPRIS.

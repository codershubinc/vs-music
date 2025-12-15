# Quazaar Windows Media Helper

This is a standalone C# console application designed to act as a "sidecar" for the main Quazaar Go application on Windows. It interfaces with the Windows Runtime (WinRT) APIs to control media playback and retrieve metadata from the System Media Transport Controls (SMTC).

## 🚀 Features

- **Native AOT Compilation**: Compiled ahead-of-time to native code for instant startup and minimal footprint.
- **Zero Dependencies**: Runs without requiring the .NET Runtime to be installed on the target machine.
- **JSON IPC**: Communicates with the main application via Standard Input/Output using JSON messages.
- **Media Control**: Supports Play, Pause, Next, Previous, Seek, and Timeline tracking.
- **Metadata Extraction**: Retrieves Title, Artist, Album, Thumbnail/Artwork, and Playback Status.

## 🛠️ Build Instructions

### Prerequisites

- **.NET 8.0 SDK** or later.
- **Visual Studio 2022** (or Build Tools) with "Desktop development with C++" workload installed (Required for Native AOT).

### Publishing

To build the optimized, standalone executable:

```powershell
dotnet publish -c Release -r win-x64 /p:PublishTrimmed=true /p:TrimMode=partial /p:EnableCompressionInSingleFile=true
```

The resulting executable will be located in:
`bin/Release/net8.0-windows10.0.19041.0/win-x64/publish/QuazaarMedia.exe`

## 📡 Communication Protocol

The application reads JSON commands from `stdin` and writes JSON responses to `stdout`.

### Handshake

On startup, the helper outputs:

```json
{ "status": "ready" }
```

### Commands

**Get Info:**
Request: `{"Action": "info"}`
Response:

```json
{
  "Title": "Song Title",
  "Artist": "Artist Name",
  "Album": "Album Name",
  "Status": "Playing",
  "Position": 12345,
  "Duration": 300000,
  "App": "Spotify",
  "ArtworkUri": "C:\\path\\to\\temp\\artwork.jpg"
}
```

**Controls:**

- `{"Action": "play"}`
- `{"Action": "pause"}`
- `{"Action": "next"}`
- `{"Action": "prev"}`
- `{"Action": "seek", "Position": 15000}` (milliseconds)

## 📂 Project Structure

- **Program.cs**: Entry point, handles the main loop and JSON parsing.
- **cmd/windows-helper/**: Contains logic for Media Session management and Artwork extraction.
- **QuazaarMedia.csproj**: Project configuration with AOT and Trimming settings.

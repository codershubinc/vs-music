# Windows Support Implementation

This document outlines the architecture and flow for Windows music control support in the VS Music extension.

## Overview

Windows support is achieved by interfacing with a custom C# application, `QuazaarMedia.exe`, which utilizes Windows native media APIs (SMTC - System Media Transport Controls) to interact with media players.

## Architecture

The implementation follows a controller-based architecture:

1.  **Factory Pattern**: `MusicControllerFactory` detects the OS and instantiates `WindowsMusicController` on Windows systems.
2.  **Controller**: `WindowsMusicController` implements the `IMusicController` interface, providing a standard API for the extension.
3.  **Helper Process**: The controller spawns `QuazaarMedia.exe` as a child process.
4.  **Communication**:
    - **Commands (Extension -> Exe)**: Sent via `stdin` (e.g., `{"Action":"info"}`).
    - **Responses (Exe -> Extension)**: Received via `stdout`.

## Data Flow

### 1. Initialization

- `MusicWebviewProvider` calls `MusicControllerFactory.create()`.
- `WindowsMusicController` is initialized.
- `startHelper()` spawns the `QuazaarMedia.exe` process.

### 2. Fetching Track Info

1.  `WindowsMusicController.getCurrentTrack()` is called.
2.  `handleWinMessage()` sends a JSON command to the helper process: `{"Action":"info"}`.
3.  `QuazaarMedia.exe` fetches current media info from Windows SMTC.
4.  The exe writes the result to `stdout`.
5.  `startHelper()` listens to `stdout` and passes data to `onMessageReceived()`.
6.  `onMessageReceived()` parses the JSON response.
7.  If valid track info is found, it posts a message to the VS Code Webview to update the UI.

## External Dependency

- **QuazaarMedia.exe**: A modified version of the [Quazaar](https://github.com/codershubinc/quazaar) project. It acts as a bridge between Node.js (VS Code) and Windows Media APIs.

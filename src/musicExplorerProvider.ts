import * as vscode from 'vscode';
import { TrackInfo } from './musicService';

export class MusicExplorerProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'musicExplorer';

    private _view?: vscode.WebviewView;
    private currentTrack: TrackInfo | null = null;
    private onControlCallback?: (action: string) => void;

    constructor(private readonly extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview();
        this.setupWebviewMessageHandling();

        // Update with current track if available
        if (this.currentTrack) {
            this.updateTrack(this.currentTrack);
        }
    }

    public updateTrack(track: TrackInfo | null) {
        this.currentTrack = track;
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateTrack',
                track: track
            });
        }
    }

    public updatePosition(position: number) {
        if (this._view && this.currentTrack) {
            this._view.webview.postMessage({
                command: 'updateProgress',
                position: position
            });
        }
    }

    private setupWebviewMessageHandling() {
        if (!this._view) {
            return;
        }

        this._view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'playPause':
                case 'nextTrack':
                case 'previousTrack':
                    if (this.onControlCallback) {
                        this.onControlCallback(message.command);
                    }
                    break;
            }
        });
    }

    public onControl(callback: (action: string) => void) {
        this.onControlCallback = callback;
    }

    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Explorer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #000000;
            color: #ffffff;
            padding: 16px;
            min-height: 100vh;
        }
        
        .music-explorer {
            background: #111111;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }
        
        .track-info {
            margin-bottom: 16px;
            text-align: center;
        }
        
        .track-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
            color: #ffffff;
            line-height: 1.3;
            word-wrap: break-word;
        }
        
        .track-artist {
            font-size: 14px;
            color: #bbbbbb;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .track-album {
            font-size: 12px;
            color: #888888;
            font-style: italic;
            opacity: 0.8;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 10px;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .status-playing {
            background: #4CAF50;
            color: white;
        }
        
        .status-paused {
            background: #FF9800;
            color: white;
        }
        
        .status-stopped {
            background: #F44336;
            color: white;
        }
        
        .progress-container {
            margin: 16px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background: #333333;
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: #007ACC;
            border-radius: 2px;
            transition: width 0.5s ease;
        }
        
        .progress-time {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #bbbbbb;
            font-weight: 500;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin-top: 16px;
        }
        
        .control-btn {
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 6px;
            background: #333333;
            color: #ffffff;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            border: 1px solid #555555;
        }
        
        .control-btn:hover {
            background: #444444;
            transform: translateY(-1px);
        }
        
        .control-btn:active {
            transform: translateY(0);
        }
        
        .control-btn.play-pause {
            width: 44px;
            height: 44px;
            font-size: 16px;
            background: #007ACC;
            border-radius: 8px;
        }
        
        .control-btn.play-pause:hover {
            background: #0086E6;
        }
        
        .no-music {
            text-align: center;
            color: #888888;
            font-size: 14px;
            padding: 32px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        
        .no-music-icon {
            font-size: 32px;
            opacity: 0.6;
        }
        
        .music-icon {
            font-size: 24px;
            margin-bottom: 8px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="music-explorer">
        <div id="musicContent">
            <div class="no-music">
                <div class="no-music-icon">🎵</div>
                <div>No music currently playing</div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentTrack = null;
        let progressUpdateInterval = null;

        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'updateTrack':
                    currentTrack = message.track;
                    updateUI();
                    setupProgressUpdates();
                    break;
                case 'updateProgress':
                    if (currentTrack && message.position !== undefined) {
                        currentTrack.position = message.position;
                        updateProgressOnly();
                    }
                    break;
            }
        });

        function setupProgressUpdates() {
            // Clear any existing interval
            if (progressUpdateInterval) {
                clearInterval(progressUpdateInterval);
                progressUpdateInterval = null;
            }
            
            // Only set up auto-updates if music is playing and has duration
            if (currentTrack && currentTrack.status === 'playing' && currentTrack.duration) {
                progressUpdateInterval = setInterval(() => {
                    if (currentTrack && currentTrack.status === 'playing') {
                        // Increment position by 1 second
                        currentTrack.position = (currentTrack.position || 0) + 1;
                        
                        // Don't exceed duration
                        if (currentTrack.position > currentTrack.duration) {
                            currentTrack.position = currentTrack.duration;
                        }
                        
                        updateProgressOnly();
                    } else {
                        clearInterval(progressUpdateInterval);
                        progressUpdateInterval = null;
                    }
                }, 1000);
            }
        }

        function updateProgressOnly() {
            if (!currentTrack || !currentTrack.duration) return;
            
            const progressPercent = (currentTrack.position || 0) / currentTrack.duration * 100;
            const progressFill = document.querySelector('.progress-fill');
            const currentTimeSpan = document.querySelector('.progress-time span:first-child');
            
            if (progressFill) {
                progressFill.style.width = progressPercent + '%';
            }
            
            if (currentTimeSpan) {
                currentTimeSpan.textContent = formatTime(currentTrack.position || 0);
            }
        }

        function updateUI() {
            const content = document.getElementById('musicContent');
            
            if (!currentTrack) {
                content.innerHTML = \`
                    <div class="no-music"> 
                        <div>No music currently playing</div>
                    </div>
                \`;
                return;
            }

            const progressPercent = currentTrack.duration && currentTrack.position 
                ? (currentTrack.position / currentTrack.duration) * 100 
                : 0;

            const statusIcon = currentTrack.status === 'playing' ? '▶' : 
                              currentTrack.status === 'paused' ? '⏸' : '⏹';

            content.innerHTML = \`
                <div class="track-info"> 
                    <div class="status-indicator status-\${currentTrack.status}">
                        \${statusIcon}
                    </div>
                    <div class="track-title">\${currentTrack.title}</div>
                    <div class="track-artist">\${currentTrack.artist}</div>
                    \${currentTrack.album ? \`<div class="track-album">\${currentTrack.album}</div>\` : ''}
                </div>
                
                \${currentTrack.duration ? \`
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${progressPercent}%"></div>
                    </div>
                    <div class="progress-time">
                        <span>\${formatTime(currentTrack.position || 0)}</span>
                        <span>\${formatTime(currentTrack.duration)}</span>
                    </div>
                </div>
                \` : ''}
                
                <div class="controls">
                    <button class="control-btn" onclick="sendCommand('previousTrack')" title="Previous Track">⏮</button>
                    <button class="control-btn play-pause" onclick="sendCommand('playPause')" title="Play/Pause">
                        \${currentTrack.status === 'playing' ? '⏸' : '▶'}
                    </button>
                    <button class="control-btn" onclick="sendCommand('nextTrack')" title="Next Track">⏭</button>
                </div>
            \`;
        }

        function formatTime(seconds) {
            if (!seconds) return '0:00';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return \`\${minutes}:\${remainingSeconds.toString().padStart(2, '0')}\`;
        }

        function sendCommand(command) {
            vscode.postMessage({ command: command });
        }
    </script>
</body>
</html>`;
    }
}
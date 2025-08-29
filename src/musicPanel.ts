import * as vscode from 'vscode';
import { TrackInfo } from './musicService';

export class MusicPanel {


    private panel: vscode.WebviewPanel | undefined;
    private currentTrack: TrackInfo | null = null;
    private onControlCallback?: (action: string) => void;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly context: vscode.ExtensionContext
    ) { }

    public show() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'musicPanel',
            'Music Player',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        this.setupWebviewMessageHandling();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        if (this.currentTrack) {
            this.updateTrack(this.currentTrack);
        }
    }

    public hide() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    public toggle() {
        if (this.panel) {
            this.hide();
        } else {
            this.show();
        }
    }

    public updateTrack(track: TrackInfo | null) {
        this.currentTrack = track;

        if (this.panel) {
            console.log("log for updating track info from musicPannel.ts");

            this.panel.webview.postMessage({
                command: 'updateTrack',
                track: track
            });
        }
    } public onControl(callback: (action: string) => void) {
        this.onControlCallback = callback;
    }

    private setupWebviewMessageHandling() {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(message => {
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

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Player</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 14px;
            color: #ffffff;
            background-color: #000000;
            margin: 0;
            padding: 20px;
            height: 100vh;
            box-sizing: border-box;
        }
        
        .music-container {
            max-width: 400px;
            margin: 0 auto;
            background: #111111;
            border: 1px solid #333333;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        
        .music-icon {
            width: 120px;
            height: 120px;
            border-radius: 12px;
            margin: 0 auto 20px;
            background: #222222;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #888888;
            border: 1px solid #333333;
        }
        
        .track-info {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .track-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #ffffff;
            word-wrap: break-word;
        }
        
        .track-artist {
            font-size: 16px;
            color: #bbbbbb;
            margin-bottom: 4px;
        }
        
        .track-album {
            font-size: 14px;
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
            margin: 20px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #333333;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: #007ACC;
            border-radius: 3px;
            transition: width 0.5s ease;
        }
        
        .progress-time {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #bbbbbb;
            font-weight: 500;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 16px;
        }
        
        .control-btn {
            background: #333333;
            border: 1px solid #555555;
            color: #ffffff;
            font-size: 18px;
            cursor: pointer;
            padding: 12px;
            border-radius: 8px;
            transition: all 0.2s ease;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .control-btn:hover {
            background: #444444;
            transform: translateY(-1px);
        }
        
        .control-btn:active {
            transform: translateY(0);
        }
        
        .control-btn.play-pause {
            font-size: 20px;
            width: 56px;
            height: 56px;
            border-radius: 10px;
            background: #007ACC;
        }
        
        .control-btn.play-pause:hover {
            background: #0086E6;
        }
        
        .no-music {
            text-align: center;
            color: #888888;
            color: var(--vscode-descriptionForeground);
            font-size: 16px;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        
        .no-music-icon {
            font-size: 48px;
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="music-container">
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
                        <div class="no-music-icon">🎵</div>
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
                <div class="music-icon">🎵</div>
                
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

    public dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}
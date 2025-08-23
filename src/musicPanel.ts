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
            this.panel.webview.postMessage({
                command: 'updateTrack',
                track: track
            });
        }
    }

    public onControl(callback: (action: string) => void) {
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
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-panel-background);
            margin: 0;
            padding: 20px;
            height: 100vh;
            box-sizing: border-box;
        }
        
        .music-container {
            max-width: 400px;
            margin: 0 auto;
            background: var(--vscode-editor-background);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .album-art {
            width: 200px;
            height: 200px;
            border-radius: 12px;
            margin: 0 auto 20px;
            background: var(--vscode-input-background);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: var(--vscode-descriptionForeground);
        }
        
        .album-art img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
        }
        
        .track-info {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .track-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        
        .track-artist {
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        
        .track-album {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .progress-container {
            margin: 20px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            transition: width 0.3s ease;
        }
        
        .progress-time {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }
        
        .control-btn {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            font-size: 24px;
            cursor: pointer;
            padding: 12px;
            border-radius: 50%;
            transition: background-color 0.2s ease;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .control-btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }
        
        .control-btn.play-pause {
            font-size: 32px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .control-btn.play-pause:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .no-music {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 16px;
            padding: 40px 20px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-playing {
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        .status-paused {
            background: #FF9800;
        }
        
        .status-stopped {
            background: #F44336;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="music-container">
        <div id="musicContent">
            <div class="no-music">
                🎵 No music currently playing
            </div>
        </div>
    </div>

    <script>
        let currentTrack = null;

        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'updateTrack':
                    currentTrack = message.track;
                    updateUI();
                    break;
            }
        });

        function updateUI() {
            const content = document.getElementById('musicContent');
            
            if (!currentTrack) {
                content.innerHTML = '<div class="no-music">🎵 No music currently playing</div>';
                return;
            }

            const progressPercent = currentTrack.duration && currentTrack.position 
                ? (currentTrack.position / currentTrack.duration) * 100 
                : 0;

            content.innerHTML = \`
                <div class="album-art">
                    \${currentTrack.albumArt 
                        ? \`<img src="\${currentTrack.albumArt}" alt="Album Art">\`
                        : '🎵'
                    }
                </div>
                
                <div class="track-info">
                    <div class="track-title">
                        <span class="status-indicator status-\${currentTrack.status}"></span>
                        \${currentTrack.title}
                    </div>
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
                    <button class="control-btn" onclick="sendCommand('previousTrack')">⏮</button>
                    <button class="control-btn play-pause" onclick="sendCommand('playPause')">
                        \${currentTrack.status === 'playing' ? '⏸' : '▶'}
                    </button>
                    <button class="control-btn" onclick="sendCommand('nextTrack')">⏭</button>
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
            const vscode = acquireVsCodeApi();
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
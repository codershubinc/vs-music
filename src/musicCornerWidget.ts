import * as vscode from 'vscode';
import { TrackInfo } from './musicService';

export class MusicCornerWidget {
    private statusBarItem: vscode.StatusBarItem;
    private webviewPanel: vscode.WebviewPanel | undefined;
    private currentTrack: TrackInfo | null = null;
    private onControlCallback?: (action: string) => void;
    private isCompactMode = false;

    constructor(private readonly extensionUri: vscode.Uri) {
        // Create a more prominent status bar item for the corner widget
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            1000 // High priority to appear at the far right
        );
        this.setupStatusBarItem();
    }

    private setupStatusBarItem() {
        this.statusBarItem.command = 'music.toggleCornerWidget';
        this.statusBarItem.show();
        this.updateStatusBar();
    }

    public updateTrack(track: TrackInfo | null) {
        this.currentTrack = track;
        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage({
                command: 'updateTrack',
                track: track
            });
        }
    }

    public updatePosition(position: number) {
        if (this.webviewPanel && this.currentTrack) {
            this.webviewPanel.webview.postMessage({
                command: 'updateProgress',
                position: position
            });
        }
    } private updateStatusBar() {
        if (!this.currentTrack) {
            this.statusBarItem.text = '$(music) Music';
            this.statusBarItem.tooltip = 'No music playing • Click to open music widget';
            this.statusBarItem.backgroundColor = undefined;
            return;
        }

        const icon = this.getStatusIcon(this.currentTrack.status);
        const title = this.truncateText(this.currentTrack.title, 20);
        const artist = this.truncateText(this.currentTrack.artist, 15);

        this.statusBarItem.text = `${icon} ${title} • ${artist}`;
        this.statusBarItem.tooltip = this.createTooltip(this.currentTrack);

        // Add subtle background color when playing
        if (this.currentTrack.status === 'playing') {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else {
            this.statusBarItem.backgroundColor = undefined;
        }
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'playing': return '$(play-circle)';
            case 'paused': return '$(debug-pause)';
            case 'stopped': return '$(primitive-square)';
            default: return '$(music)';
        }
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 1) + '…';
    }

    private createTooltip(track: TrackInfo): string {
        let tooltip = `🎵 ${track.title}\\n👤 ${track.artist}`;
        if (track.album) {
            tooltip += `\\n💿 ${track.album}`;
        }
        if (track.duration && track.position) {
            const progress = this.formatTime(track.position) + ' / ' + this.formatTime(track.duration);
            tooltip += `\\n⏰ ${progress}`;
        }
        tooltip += `\\n▶ Status: ${track.status}`;
        tooltip += '\\n\\n🖱️ Click to toggle corner music widget';
        return tooltip;
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    public toggleCornerWidget() {
        if (this.webviewPanel) {
            this.hideCornerWidget();
        } else {
            this.showCornerWidget();
        }
    }

    public showCornerWidget() {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        // Create a small webview panel positioned as an overlay
        this.webviewPanel = vscode.window.createWebviewPanel(
            'musicCornerWidget',
            'Music',
            {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true
            },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        this.webviewPanel.webview.html = this.getCornerWidgetContent();
        this.setupWebviewMessageHandling();

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });

        if (this.currentTrack) {
            this.updateTrack(this.currentTrack);
        }
    }

    public hideCornerWidget() {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = undefined;
        }
    }

    private setupWebviewMessageHandling() {
        if (!this.webviewPanel) {
            return;
        }

        this.webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'playPause':
                case 'nextTrack':
                case 'previousTrack':
                    if (this.onControlCallback) {
                        this.onControlCallback(message.command);
                    }
                    break;
                case 'close':
                    this.hideCornerWidget();
                    break;
            }
        });
    }

    public onControl(callback: (action: string) => void) {
        this.onControlCallback = callback;
    }

    private getCornerWidgetContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Widget</title>
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
            margin: 0;
            padding: 0;
            overflow: hidden;
            min-height: 100vh;
        }
        
        .corner-widget {
            width: 340px;
            background: #111111;
            border: 1px solid #333333;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }
        
        .widget-header {
            background: #222222;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333333;
        }
        
        .widget-title {
            font-weight: 600;
            font-size: 14px;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .close-btn {
            background: #333333;
            border: 1px solid #555555;
            color: #ffffff;
            cursor: pointer;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .close-btn:hover {
            background: #444444;
        }
        
        .widget-content {
            padding: 20px;
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
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.3;
        }
        
        .track-artist {
            font-size: 14px;
            color: #bbbbbb;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .track-album {
            font-size: 12px;
            color: #888888;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            opacity: 0.8;
            font-style: italic;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
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
            margin-top: 16px;
        }
        
        .control-btn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 8px;
            background: #333333;
            color: #ffffff;
            cursor: pointer;
            font-size: 16px;
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
            width: 48px;
            height: 48px;
            font-size: 18px;
            border-radius: 10px;
            background: #007ACC;
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
            font-size: 28px;
            margin-bottom: 8px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="corner-widget">
        <div class="widget-header">
            <div class="widget-title">🎵 Now Playing</div>
            <button class="close-btn" onclick="sendCommand('close')">✕</button>
        </div>
        <div class="widget-content">
            <div id="musicContent">
                <div class="no-music">
                    <div class="no-music-icon">🎵</div>
                    <div>No music currently playing</div>
                </div>
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
                <div class="track-info">
                    <div class="music-icon">🎵</div>
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
        this.statusBarItem.dispose();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}
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
        this.updateStatusBar();

        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage({
                command: 'updateTrack',
                track: track
            });
        }
    }

    private updateStatusBar() {
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
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .corner-widget {
            width: 280px;
            background: var(--vscode-editor-background);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .widget-header {
            background: var(--vscode-titleBar-activeBackground);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .widget-title {
            font-weight: 600;
            font-size: 12px;
            color: var(--vscode-titleBar-activeForeground);
        }
        
        .close-btn {
            background: none;
            border: none;
            color: var(--vscode-titleBar-activeForeground);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .close-btn:hover {
            background: var(--vscode-titleBar-border);
        }
        
        .widget-content {
            padding: 16px;
        }
        
        .track-info {
            margin-bottom: 12px;
        }
        
        .track-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .track-artist {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .track-album {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-top: 2px;
        }
        
        .album-art {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            background: var(--vscode-input-background);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--vscode-descriptionForeground);
            float: right;
            margin-left: 12px;
        }
        
        .album-art img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
        }
        
        .progress-container {
            margin: 12px 0;
            clear: both;
        }
        
        .progress-bar {
            width: 100%;
            height: 3px;
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 6px;
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
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }
        
        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
        }
        
        .control-btn {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: background-color 0.2s ease;
            font-size: 16px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .control-btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }
        
        .control-btn.play-pause {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            font-size: 18px;
        }
        
        .control-btn.play-pause:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .no-music {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            padding: 20px 10px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 6px;
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
    <div class="corner-widget">
        <div class="widget-header">
            <div class="widget-title">🎵 Music</div>
            <button class="close-btn" onclick="sendCommand('close')">✕</button>
        </div>
        <div class="widget-content">
            <div id="musicContent">
                <div class="no-music">
                    🎵 No music currently playing
                </div>
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
                <div class="track-info">
                    \${currentTrack.albumArt ? \`
                    <div class="album-art">
                        <img src="\${currentTrack.albumArt}" alt="Album Art">
                    </div>
                    \` : \`
                    <div class="album-art">🎵</div>
                    \`}
                    
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
        this.statusBarItem.dispose();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}
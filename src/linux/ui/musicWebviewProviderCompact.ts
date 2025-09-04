import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LinuxMusicService } from '../musicService';

export class LinuxMusicWebviewProviderCompact implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _musicService: LinuxMusicService;
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, musicService: LinuxMusicService) {
        this._context = context;
        this._musicService = musicService;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this._context.extensionPath),
                vscode.Uri.file('/home') // Allow access to cached artwork files
            ]
        };

        webviewView.webview.html = this._getCompactHtml();

        webviewView.webview.onDidReceiveMessage(
            (message) => {
                this.handleWebviewMessage(message);
            },
            undefined,
            this._context.subscriptions
        );

        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.startPeriodicUpdates();
                this.updateWebview();
            } else {
                this.stopPeriodicUpdates();
            }
        });

        if (webviewView.visible) {
            this.startPeriodicUpdates();
            this.updateWebview();
        }
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'webviewReady':
                    console.log('Webview ready, sending initial data...');
                    await this.updateWebview();
                    break;

                case 'playPause':
                    await this._musicService.playPause();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'next':
                    await this._musicService.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'previous':
                    await this._musicService.previous();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                default:
                    console.warn('Unknown webview message command:', message.command);
            }
        } catch (error) {
            console.error('Error handling webview message:', error);
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    private startPeriodicUpdates(): void {
        if (this._updateTimer) {
            return;
        }

        this._updateTimer = setInterval(() => {
            this.updateWebview();
        }, 1000);
    }

    private stopPeriodicUpdates(): void {
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
            this._updateTimer = undefined;
        }
    }

    private async updateWebview(): Promise<void> {
        if (!this._view || !this._view.visible) {
            return;
        }

        try {
            const trackInfo = await this._musicService.getCurrentTrack();
            const currentPosition = await this._musicService.getPosition();

            if (!trackInfo || !trackInfo.title) {
                this._view.webview.postMessage({
                    command: 'updateTrack',
                    track: null
                });
                return;
            }

            let artworkUri = '';
            if (trackInfo.artUrl) {
                try {
                    const artworkFileUri = vscode.Uri.parse(trackInfo.artUrl);
                    artworkUri = this._view.webview.asWebviewUri(artworkFileUri).toString();
                    console.log('Converted artwork URI:', artworkUri);
                } catch (error) {
                    console.warn('Error converting artwork URI:', error);
                }
            }

            this._view.webview.postMessage({
                command: 'updateTrack',
                track: trackInfo,
                artworkUri: artworkUri,
                position: currentPosition || 0
            });

        } catch (error) {
            console.error('Error updating webview:', error);
            this._view?.webview.postMessage({
                command: 'updateTrack',
                track: null
            });
        }
    }

    private _getCompactHtml(): string {
        try {
            // Try to read from the dist directory first (packaged extension)
            let htmlPath = path.join(this._context.extensionPath, 'dist', 'src', 'linux', 'ui', 'webview', 'compactPlayer.html');

            if (!fs.existsSync(htmlPath)) {
                // Fallback to src directory (development)
                htmlPath = path.join(this._context.extensionPath, 'src', 'linux', 'ui', 'webview', 'compactPlayer.html');
            }

            console.log('Trying to read HTML from:', htmlPath);
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            return htmlContent;
        } catch (error) {
            console.error('Error reading compact HTML file:', error);
            return this._getFallbackHtml();
        }
    }

    private _getFallbackHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VS Music Player</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .error-message {
            color: var(--vscode-errorForeground);
        }
    </style>
</head>
<body>
    <div class="error-message">
        <h3>?????? Music Player Error</h3>
        <p>Unable to load compact player interface.</p>
        <p>Please check the extension installation.</p>
    </div>
</body>
</html>`;
    }

    public async forceUpdate(): Promise<void> {
        await this.updateWebview();
    }

    public show(): void {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    public dispose(): void {
        this.stopPeriodicUpdates();
    }
}

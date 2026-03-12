import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ArtworkUtil } from '../../linux/utils/artworkUtil';
import { IMusicController } from '../models/models';
import { MusicControllerFactory } from '../musicControllerFactory';

export class MusicWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _controller: IMusicController | null;
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;

    // Artwork cache
    private _lastArtUrl = '';
    private _lastArtworkDataUri = '';
    private _lastWebviewArtUri = '';

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._controller = MusicControllerFactory.create(context, this._view?.webview);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        this._controller = MusicControllerFactory.create(this._context, this._view?.webview);

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this._context.extensionPath),
                vscode.Uri.file('/home')
            ]
        };

        webviewView.webview.html = this._getHtml();

        webviewView.webview.onDidReceiveMessage(
            (message) => { this.handleWebviewMessage(message); },
            undefined,
            this._context.subscriptions
        );

        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.startUpdates();
                this.updateWebview();
            } else {
                this.stopUpdates();
            }
        });

        if (webviewView.visible) {
            this.startUpdates();
            this.updateWebview();
        }
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'webviewReady':
                    await this.updateWebview();
                    break;
                case 'playPause':
                    await this._controller?.playPause();
                    setTimeout(() => this.updateWebview(), 100);
                    break;
                case 'next':
                    await this._controller?.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;
                case 'previous':
                    await this._controller?.previous();
                    setTimeout(() => this.updateWebview(), 100);
                    break;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    private startUpdates(): void {
        if (this._updateTimer) { return; }

        if (process.platform === 'linux') {

            this._controller?.onTrackChanged(() => {
                this.updateWebview();
            });

            this._updateTimer = setInterval(() => { }, 2_147_483_647);
        } else {
            this._updateTimer = setInterval(() => { this.updateWebview(); }, 1000);
        }
    }

    private stopUpdates(): void {
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
            this._updateTimer = undefined;
        }
    }

    private async updateWebview(): Promise<void> {
        if (!this._view || !this._view.visible) { return; }

        try {
            const trackInfo = await this._controller?.getCurrentTrack();

            if (process.platform === 'win32') { return; }

            if (!trackInfo || !trackInfo.title) {
                this._view.webview.postMessage({ command: 'updateTrack', track: null });
                return;
            }

            let webviewArtworkUri = '';
            let artworkDataUri = '';
            const artUrl = trackInfo.artUrl || '';

            // Cache check
            if (artUrl && artUrl === this._lastArtUrl) {
                webviewArtworkUri = this._lastWebviewArtUri;
                artworkDataUri = this._lastArtworkDataUri;
            } else {
                // OPTIMIZATION: Async file reading
                try {
                    const localPath = await ArtworkUtil.downloadArtwork(artUrl);
                    if (localPath) {
                        const fileUri = vscode.Uri.file(localPath);
                        webviewArtworkUri = this._view!.webview.asWebviewUri(fileUri).toString();

                        try {
                            // CHANGE: fs.promises.readFile (Async) instead of readFileSync
                            const buffer = await fs.promises.readFile(localPath);
                            const ext = path.extname(localPath).toLowerCase();
                            let mime = 'image/jpeg';
                            if (ext === '.png') { mime = 'image/png'; }
                            else if (ext === '.webp') { mime = 'image/webp'; }
                            artworkDataUri = `data:${mime};base64,${buffer.toString('base64')}`;
                        } catch (e) {
                            console.warn('Failed to read artwork file:', e);
                        }
                    }
                } catch (e) {
                    console.warn('Artwork processing error:', e);
                }

                this._lastArtUrl = artUrl;
                this._lastWebviewArtUri = webviewArtworkUri;
                this._lastArtworkDataUri = artworkDataUri;
            }

            this._view.webview.postMessage({
                command: 'updateTrack',
                track: trackInfo,
                artworkUri: webviewArtworkUri,
                artworkDataUri: artworkDataUri,
            });

        } catch (error) {
            console.error('Error updating webview:', error);
        }
    }

    private _getHtml(): string {
        try {
            let htmlPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'musicPlayer.html');
            let cssPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'static', 'css', 'musicPlayer.css');
            let jsPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'static', 'js', 'utils', 'musicPlayer.js');

            if (!fs.existsSync(htmlPath)) {
                htmlPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.html');
                cssPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.css');
                jsPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.js');
            }

            let htmlContent = fs.readFileSync(htmlPath, 'utf8');
            const cssUri = this._view?.webview.asWebviewUri(vscode.Uri.file(cssPath));
            const jsUri = this._view?.webview.asWebviewUri(vscode.Uri.file(jsPath));

            htmlContent = htmlContent.replace(/\{\{\s*cssUri\s*\}\}/g, cssUri ? cssUri.toString() : '');
            htmlContent = htmlContent.replace(/\{\{\s*jsUri\s*\}\}/g, jsUri ? jsUri.toString() : '');

            return htmlContent;

        } catch (error) {
            return `<html><body><h3>Error</h3><p>${error}</p></body></html>`;
        }
    }

    public async forceUpdate(): Promise<void> {
        await this.updateWebview();
    }

    public show(): void {
        this._view?.show?.(true);
    }

    public dispose(): void {
        this.stopUpdates();
        this._controller?.dispose();
        this._view = undefined;
    }
}
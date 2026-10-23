import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { ArtworkUtil } from '../../linux/utils/artworkUtil';
import { IMusicController } from '../models/models';
import { MusicControllerFactory } from '../musicControllerFactory';
import { log } from 'console';

export class MusicWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _controller: IMusicController | null;
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;
    private _isSubscribed = false;

    // Artwork cache
    private _lastArtUrl = '';
    private _lastWebviewArtUri = '';
    private _lastSentTrackJson = '';
    private _isWebviewReady = false;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        if (process.platform === 'linux') {
            this._controller = MusicControllerFactory.create(context, undefined);
        } else {
            this._controller = null;
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        this._isWebviewReady = false;
        this._lastSentTrackJson = '';

        if (!this._controller) {
            this._controller = MusicControllerFactory.create(this._context, this._view?.webview);
        } else if (process.platform === 'win32') {
            this.stopUpdates();
            this._controller.dispose();
            this._isSubscribed = false;
            this._controller = MusicControllerFactory.create(this._context, this._view?.webview);
        }

        const localRoots = [
            vscode.Uri.file(this._context.extensionPath),
            this._context.globalStorageUri,
            vscode.Uri.file(os.homedir())
        ];
        if (process.platform === 'linux' || process.platform === 'darwin') {
            localRoots.push(vscode.Uri.file('/home'), vscode.Uri.file('/tmp'));
        }

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: localRoots
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
                this.updateWebview(true);
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
                    this._isWebviewReady = true;
                    await this.updateWebview(true);
                    break;
                case 'playPause':
                    await this.playPause();
                    break;
                case 'next':
                    await this.next();
                    break;
                case 'previous':
                    await this.previous();
                    break;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    private startUpdates(): void {
        if (process.platform === 'linux') {
            if (!this._isSubscribed && this._controller) {
                this._controller.onTrackChanged(() => {
                    this.updateWebview();
                });
                this._isSubscribed = true;
            }
        } else {
            if (this._updateTimer) {
                return;
            }
            const interval = vscode.workspace.getConfiguration('music').get<number>('updateInterval', 2000);
            this._updateTimer = setInterval(() => {
                this.updateWebview();
            }, interval);
        }
    }

    private stopUpdates(): void {
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
            this._updateTimer = undefined;
        }
    }

    private async updateWebview(force: boolean = false): Promise<void> {
        if (!this._view || !this._view.visible) { return; }

        try {
            const trackInfo = await this._controller?.getCurrentTrack();
            console.log("Updating track info ", trackInfo);

            if (process.platform === 'win32') { return; }

            if (!trackInfo || !trackInfo.title) {
                if (force || this._lastSentTrackJson !== 'null') {
                    if (this._isWebviewReady) {
                        this._lastSentTrackJson = 'null';
                    }
                    log('No track info available, clearing webview');
                    this._view.webview.postMessage({ command: 'updateTrack', track: null });
                }
                return;
            }

            const currentTrackKey = JSON.stringify({
                title: trackInfo.title,
                artist: trackInfo.artist,
                album: trackInfo.album,
                status: trackInfo.status,
                artUrl: trackInfo.artUrl || ''
            });

            if (!force && this._lastSentTrackJson === currentTrackKey) {
                return;
            }

            let webviewArtworkUri = '';
            const artUrl = trackInfo.artUrl || '';

            // Cache check
            if (artUrl && artUrl === this._lastArtUrl) {
                webviewArtworkUri = this._lastWebviewArtUri;
            } else {
                if (artUrl.startsWith('file://')) {
                    try {
                        webviewArtworkUri = this._view.webview.asWebviewUri(vscode.Uri.parse(artUrl)).toString();
                    } catch (e) {
                        console.error('Failed to parse file URI:', e);
                    }
                } else if (artUrl.startsWith('/')) {
                    try {
                        webviewArtworkUri = this._view.webview.asWebviewUri(vscode.Uri.file(artUrl)).toString();
                    } catch (e) {
                        console.error('Failed to parse file path:', e);
                    }
                } else if (artUrl.startsWith('http://') || artUrl.startsWith('https://')) {
                    webviewArtworkUri = artUrl;
                } else if (artUrl) {
                    try {
                        const localPath = await ArtworkUtil.downloadArtwork(artUrl);
                        if (localPath) {
                            const fileUri = vscode.Uri.file(localPath);
                            webviewArtworkUri = this._view.webview.asWebviewUri(fileUri).toString();
                        }
                    } catch (e) {
                        console.warn('Artwork processing error:', e);
                    }
                }

                this._lastArtUrl = artUrl;
                this._lastWebviewArtUri = webviewArtworkUri;
            }

            if (this._isWebviewReady) {
                this._lastSentTrackJson = currentTrackKey;
            }

            log('Sending track update to webview with artwork URI:', webviewArtworkUri);
            const msgSend = this._view.webview.postMessage({
                command: 'updateTrack',
                track: trackInfo,
                artworkUri: webviewArtworkUri,
            });
            console.log("Sent updateTrack message, result: ", msgSend);

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
                cssPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'static', 'css', 'musicPlayer.css');
                jsPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'static', 'js', 'utils', 'musicPlayer.js');
            }

            let htmlContent = fs.readFileSync(htmlPath, 'utf8');
            const cssUri = this._view?.webview.asWebviewUri(vscode.Uri.file(cssPath));
            const jsUri = this._view?.webview.asWebviewUri(vscode.Uri.file(jsPath));

            htmlContent = htmlContent.replace(/\{\{\s*cssUri\s*\}\}/g, cssUri ? cssUri.toString() : '');
            htmlContent = htmlContent.replace(/\{\{\s*jsUri\s*\}\}/g, jsUri ? jsUri.toString() : '');
            const cspSource = this._view?.webview.cspSource || 'vscode-resource:';
            htmlContent = htmlContent.replace(/\{\{\s*cspSource\s*\}\}/g, cspSource);

            return htmlContent;

        } catch (error) {
            return `<html><body><h3>Error</h3><p>${error}</p></body></html>`;
        }
    }

    public async playPause(): Promise<void> {
        if (!this._controller) {
            this._controller = MusicControllerFactory.create(this._context, this._view?.webview);
        }
        await this._controller.playPause();
        setTimeout(() => {
            this.updateWebview(true);
        }, 100);
    }

    public async next(): Promise<void> {
        if (!this._controller) {
            this._controller = MusicControllerFactory.create(this._context, this._view?.webview);
        }
        await this._controller.next();
        setTimeout(() => {
            this.updateWebview(true);
        }, 100);
    }

    public async previous(): Promise<void> {
        if (!this._controller) {
            this._controller = MusicControllerFactory.create(this._context, this._view?.webview);
        }
        await this._controller.previous();
        setTimeout(() => {
            this.updateWebview(true);
        }, 100);
    }

    public async forceUpdate(): Promise<void> {
        await this.updateWebview(true);
    }

    public show(): void {
        this._view?.show?.(true);
    }

    public dispose(): void {
        this.stopUpdates();
        this._controller?.dispose();
        this._controller = null;
        this._isSubscribed = false;
        this._isWebviewReady = false;
        this._lastSentTrackJson = '';
        this._view = undefined;
    }
}
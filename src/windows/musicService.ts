import * as vscode from 'vscode';
import { PlayerFunctions, TrackInfo, IMusicController } from "../common/models/models";
import { handleWinMessage, winHelper, startHelper } from "./windowsHelper";

export class WindowsMusicController implements IMusicController {
    private updateInterval: NodeJS.Timeout | null = null;
    private currentTrack: TrackInfo | null = null;
    private onTrackChangedCallback: ((track: TrackInfo | null) => void) | null = null;
    private context: vscode.ExtensionContext | undefined;
    private webview: vscode.Webview | undefined;

    constructor(context?: vscode.ExtensionContext, webview?: vscode.Webview) {
        this.context = context;
        this.webview = webview;

        // Initialize the external helper process
        startHelper();
    }

    playPause(): Promise<Boolean | undefined> {
        return Promise.resolve(true);
    }
    next(): Promise<Boolean | undefined> {
        return Promise.resolve(true);
    }
    previous(): Promise<Boolean | undefined> {
        return Promise.resolve(true);
    }
    getCurrentTrack(): Promise<TrackInfo | null> {
        handleWinMessage(`{"Action":"info"}`, this.context, this.webview);
        return Promise.resolve(null);
    }
    getPosition(): Promise<number> {
        return Promise.resolve(0);
    }
    isAvailable(): boolean {
        return true;
    }
    async getArtworkUri(artUrl: string, webview: vscode.Webview): Promise<string> {
        return '';
    }
    dispose() {
        // cleanup
    }
    startPolling(): Promise<Boolean | undefined> {
        return Promise.resolve(true);
    }
}

// Export a default instance if needed, or just the class
export default WindowsMusicController;
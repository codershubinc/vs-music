import * as vscode from 'vscode';

export interface TrackInfo {
    title: string;
    artUrl: string;
    artist: string;
    album: string;
    duration?: number;
    position?: number;
    status: 'playing' | 'paused' | 'stopped';
    player?: string;
}

export interface IMusicController {
    getCurrentTrack(): Promise<TrackInfo | null>;
    getPosition(): Promise<number | null>;
    playPause(): Promise<Boolean | undefined>;
    next(): Promise<Boolean | undefined>;
    previous(): Promise<Boolean | undefined>;
    isAvailable(): boolean;
    getArtworkUri(artUrl: string, webview: vscode.Webview): Promise<string>;
    dispose(): void;
}

export interface PlayerFunctions {
    playPause(): Promise<Boolean | undefined>;
    nextTrack(): Promise<Boolean | undefined>;
    previousTrack(): Promise<Boolean | undefined>;
    getCurrentTrack(): Promise<TrackInfo | null>;
    startPolling(): Promise<Boolean | undefined>;
}
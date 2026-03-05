import * as vscode from 'vscode';
import playerCtrlLinux from './utils/playerctl';

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

export class LinuxMusicService {
    constructor(_context: vscode.ExtensionContext) {
        // D-Bus is managed by the PLAYER_CONTROLLER_LINUX singleton
    }

    /** Zero-cost — reads the in-memory state kept current by D-Bus signals */
    public async getCurrentTrack(): Promise<TrackInfo | null> {
        const s = playerCtrlLinux.getState();
        if (!s.title && !s.artist) { return null; }
        return {
            title: s.title || 'Unknown Title',
            artUrl: s.artUrl,
            artist: s.artist || 'Unknown Artist',
            album: s.album || 'Unknown Album',
            position: s.positionSecs,
            duration: s.durationSecs,
            status: s.status,
            player: s.player,
        };
    }

    /** Zero-cost — returns cached position from the last PropertiesChanged signal */
    public async getPosition(): Promise<number | null> {
        return playerCtrlLinux.getState().positionSecs;
    }

    public async playPause(): Promise<void> {
        await playerCtrlLinux.playPause();
    }

    public async next(): Promise<void> {
        await playerCtrlLinux.next();
    }

    public async previous(): Promise<void> {
        await playerCtrlLinux.previous();
    }

    public onTrackChanged(callback: (track: TrackInfo | null) => void) {
        playerCtrlLinux.onTrackChange(async () => {
            callback(await this.getCurrentTrack());
        });
    }

    public get isAvailable(): boolean {
        return playerCtrlLinux.isConnected;
    }

    public dispose() {
        playerCtrlLinux.dispose();
    }
}



import * as vscode from 'vscode';
import { getPlayerCtrlLinux, PlayerCtrlLinux } from './utils/playerctl';

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
    private playerCtrl: PlayerCtrlLinux;

    constructor(_context: vscode.ExtensionContext) {
        this.playerCtrl = getPlayerCtrlLinux();
    }

    /** Zero-cost — reads the in-memory state kept current by D-Bus signals */
    public async getCurrentTrack(): Promise<TrackInfo | null> {
        const s = this.playerCtrl.getState();
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
        return this.playerCtrl.getState().positionSecs;
    }

    public async playPause(): Promise<void> {
        await this.playerCtrl.playPause();
    }

    public async next(): Promise<void> {
        await this.playerCtrl.next();
    }

    public async previous(): Promise<void> {
        await this.playerCtrl.previous();
    }

    public onTrackChanged(callback: (track: TrackInfo | null) => void) {
        this.playerCtrl.onTrackChange(async () => {
            callback(await this.getCurrentTrack());
        });
    }

    public get isAvailable(): boolean {
        return this.playerCtrl.isConnected;
    }

    public dispose() {
        this.playerCtrl.dispose();
    }
}



import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';

export interface TrackInfo {
    title: string;
    artist: string;
    album: string;
    duration?: number;
    position?: number;
    status: 'playing' | 'paused' | 'stopped';
}

export class MusicService {
    private updateInterval: NodeJS.Timeout | null = null;
    private currentTrack: TrackInfo | null = null;
    private onTrackChangedCallback?: (track: TrackInfo | null) => void;
    private onPositionChangedCallback?: (position: number) => void;
    private isPlayerctlAvailable = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Check if playerctl is available
        await this.checkPlayerctlAvailability();
        this.startPolling();
    }

    private async checkPlayerctlAvailability(): Promise<void> {
        return new Promise((resolve) => {
            const playerctl = spawn('playerctl', ['--version']);
            console.log('Checking playerctl availability... ', playerctl);


            playerctl.on('exit', (code) => {
                this.isPlayerctlAvailable = code === 0;
                if (this.isPlayerctlAvailable) {
                    console.log('playerctl is available');
                } else {
                    console.warn('playerctl not available - music controls will be limited');
                }
                resolve();
            });
            playerctl.on('error', () => {
                this.isPlayerctlAvailable = false;
                console.warn('playerctl not found on system');
                resolve();
            });
        });
    }

    private startPolling() {
        const config = vscode.workspace.getConfiguration('music');
        const interval = config.get<number>('updateInterval', 1000);

        this.updateInterval = setInterval(() => {
            this.updateTrackInfo();
        }, interval);
    }

    private updateTrackInfo() {
        if (!this.isPlayerctlAvailable) {
            // Fallback to showing a default message
            this.setCurrentTrack(null);
            return;
        }

        const playerctl = spawn('playerctl', [
            'metadata',
            '--format',
            '{{title}}|{{artist}}|{{album}}|{{duration(position)}}|{{duration(mpris:length)}}|{{status}}'
        ]);

        let output = '';
        playerctl.stdout.on('data', (data) => {
            output += data.toString();
        });

        playerctl.on('exit', (code) => {
            if (code === 0 && output.trim()) {
                const parts = output.trim().split('|');
                if (parts.length >= 6) {
                    const trackInfo: TrackInfo = {
                        title: parts[0] || 'Unknown Title',
                        artist: parts[1] || 'Unknown Artist',
                        album: parts[2] || 'Unknown Album',
                        position: this.parseDuration(parts[3]),
                        duration: this.parseDuration(parts[4]),
                        status: this.mapPlaybackStatus(parts[5])
                    };
                    this.setCurrentTrack(trackInfo);
                } else {
                    this.setCurrentTrack(null);
                }
            } else {
                this.setCurrentTrack(null);
            }
        });

        playerctl.on('error', () => {
            this.setCurrentTrack(null);
        });
    }

    private parseDuration(duration: string): number | undefined {
        if (!duration || duration === '' || duration === 'null') {
            return undefined;
        }
        const parts = duration.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]);
            const seconds = parseInt(parts[1]);
            if (!isNaN(minutes) && !isNaN(seconds)) {
                return minutes * 60 + seconds;
            }
        }
        return undefined;
    }

    private mapPlaybackStatus(status: string): 'playing' | 'paused' | 'stopped' {
        switch (status?.toLowerCase()) {
            case 'playing': return 'playing';
            case 'paused': return 'paused';
            default: return 'stopped';
        }
    }

    private setCurrentTrack(track: TrackInfo | null) {
        const wasPlayingBefore = this.currentTrack?.status === 'playing';
        const isPlayingNow = track?.status === 'playing';
        const trackChanged = !this.currentTrack ||
            !track ||
            this.currentTrack.title !== track.title ||
            this.currentTrack.artist !== track.artist ||
            this.currentTrack.status !== track.status;

        const positionChanged = this.currentTrack && track &&
            Math.abs((this.currentTrack.position || 0) - (track.position || 0)) > 2; // Allow 2 second tolerance

        this.currentTrack = track;

        // Always fire for track changes, or when playback starts/stops
        if (trackChanged || wasPlayingBefore !== isPlayingNow) {
            if (this.onTrackChangedCallback) {
                this.onTrackChangedCallback(track);
            }
        } else if (positionChanged && track?.position !== undefined && this.onPositionChangedCallback) {
            // Fire position updates for playing tracks
            this.onPositionChangedCallback(track.position);
        }
    }

    public getCurrentTrack(): TrackInfo | null {
        return this.currentTrack;
    }

    public onTrackChanged(callback: (track: TrackInfo | null) => void) {
        this.onTrackChangedCallback = callback;
    }

    public onPositionChanged(callback: (position: number) => void) {
        this.onPositionChangedCallback = callback;
    }

    public async playPause() {
        console.log("Toggling play/pause");

        if (!this.isPlayerctlAvailable) {
            vscode.window.showWarningMessage('playerctl is not available. Please install it to control music playback.');
            return;
        }
        try {
            console.log("Current track:", this.currentTrack);
            spawn('playerctl', ['play-pause']);

        } catch (error) {
            console.error('Error toggling play/pause:', error);
            vscode.window.showErrorMessage('Failed to toggle play/pause');
        }
    }

    public async nextTrack() {
        if (!this.isPlayerctlAvailable) {
            vscode.window.showWarningMessage('playerctl is not available. Please install it to control music playback.');
            return;
        }

        try {
            spawn('playerctl', ['next']);
        } catch (error) {
            console.error('Error skipping to next track:', error);
            vscode.window.showErrorMessage('Failed to skip to next track');
        }
    };

    public async previousTrack() {
        if (!this.isPlayerctlAvailable) {
            vscode.window.showWarningMessage('playerctl is not available. Please install it to control music playback.');
            return;
        }

        try {
            spawn('playerctl', ['previous']);
        } catch (error) {
            console.error('Error going to previous track:', error);
            vscode.window.showErrorMessage('Failed to go to previous track');
        }
    }

    public dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
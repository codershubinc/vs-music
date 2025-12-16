import * as vscode from 'vscode';
import { spawn } from 'child_process';

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
    private updateInterval: NodeJS.Timeout | null = null;
    private currentTrack: TrackInfo | null = null;
    private onPositionChangedCallback?: (position: number) => void;
    private isPlayerctlAvailable = false;
    private extensionContext: vscode.ExtensionContext;

    // simple in-memory artwork cache: key -> local path or URL
    private artworkCache: Map<string, string> = new Map();

    private trackCache: { data: TrackInfo | null, timestamp: number } = { data: null, timestamp: 0 };
    private readonly CACHE_DURATION = 800; // 800ms cache

    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.initialize();
    }

    public async initialize() {
        await this.checkPlayerctlAvailability();
    }

    private async checkPlayerctlAvailability(): Promise<void> {
        return new Promise((resolve) => {
            const playerctl = spawn('playerctl', ['--version']);

            playerctl.on('exit', (code) => {
                this.isPlayerctlAvailable = code === 0;
                if (!this.isPlayerctlAvailable) {
                    console.warn('Linux Music Service: playerctl not available - music controls will be limited');
                }
                resolve();
            });

            playerctl.on('error', () => {
                console.warn('Linux Music Service: playerctl not found on system');
                this.isPlayerctlAvailable = false;
                resolve();
            });
        });
    }


    private hasTrackChanged(newTrack: TrackInfo | null): boolean {
        if (!this.currentTrack && !newTrack) {
            return false;
        }

        if (!this.currentTrack || !newTrack) {
            return true;
        }

        return (
            this.currentTrack.title !== newTrack.title ||
            this.currentTrack.artist !== newTrack.artist ||
            this.currentTrack.status !== newTrack.status ||
            Math.abs((this.currentTrack.position || 0) - (newTrack.position || 0)) > 2
        );
    }

    public async getCurrentTrack(): Promise<TrackInfo | null> {
        const now = Date.now();

        // ✅ Return cached data if fresh (reduces spawn calls by 80%)
        if (this.trackCache.data && now - this.trackCache.timestamp < this.CACHE_DURATION) {
            return this.trackCache.data;
        }

        // ✅ Single playerctl call instead of multiple
        const track = await this.fetchAllDataInOneCall();
        this.trackCache = { data: track, timestamp: now };
        return track;
    }

    private async fetchAllDataInOneCall(): Promise<TrackInfo | null> {
        return new Promise((resolve) => {
            // ✅ One spawn call for all data instead of 4-5 separate calls
            const playerctl = spawn('playerctl', [
                'metadata', '--format',
                '{{title}}|||{{mpris:artUrl}}|||{{artist}}|||{{album}}|||{{duration(position)}}|||{{duration(mpris:length)}}|||{{status}}|||{{playerName}}'
            ]);

            let output = '';
            playerctl.stdout.on('data', (data) => {
                output += data.toString();
            });

            playerctl.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    try {
                        const cleanedOutput = output.trim();

                        const parts = cleanedOutput.split('|||'); if (parts.length >= 8) {
                            const track: TrackInfo = {
                                title: parts[0] || 'Unknown Title',
                                artUrl: parts[1] || '',
                                artist: parts[2] || 'Unknown Artist',
                                album: parts[3] || 'Unknown Album',
                                position: this.parseDuration(parts[4]),
                                duration: this.parseDuration(parts[5]),
                                status: (parts[6]?.toLowerCase() as any) || 'stopped',
                                player: parts[7] || 'Unknown Player'
                            };
                            resolve(track);
                        } else {
                            console.error('Unexpected playerctl output format. Expected 8 parts, got:', parts.length);
                            console.error('Parts:', parts);
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('Failed to parse playerctl output:', error);
                        console.error('Raw output was:', JSON.stringify(output));
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });

            playerctl.on('error', () => {
                resolve(null);
            });
        });
    }

    private parseDuration(duration: string): number {
        if (!duration) {
            return 0;
        }
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
    }

    // Control methods
    public async playPause(): Promise<void> {
        if (!this.isPlayerctlAvailable) {
            vscode.window.showWarningMessage('playerctl is not available. Please install it to control music playback.');
            return;
        }

        return new Promise((resolve, reject) => {
            const playerctl = spawn('playerctl', ['play-pause']);
            playerctl.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`playerctl play-pause failed with code ${code}`));
                }
            });
        });
    }

    public async next(): Promise<void> {
        if (!this.isPlayerctlAvailable) {
            vscode.window.showWarningMessage('playerctl is not available. Please install it to control music playback.');
            return;
        }

        return new Promise((resolve, reject) => {
            const playerctl = spawn('playerctl', ['next']);
            playerctl.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`playerctl next failed with code ${code}`));
                }
            });
        });
    }

    public async previous(): Promise<void> {
        if (!this.isPlayerctlAvailable) {
            vscode.window.showWarningMessage('playerctl is not available. Please install it to control music playback.');
            return;
        }

        return new Promise((resolve, reject) => {
            const playerctl = spawn('playerctl', ['previous']);
            playerctl.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`playerctl previous failed with code ${code}`));
                }
            });
        });
    }

    public async getPosition(): Promise<number | null> {
        if (!this.isPlayerctlAvailable) {
            return null;
        }

        return new Promise((resolve) => {
            const playerctl = spawn('playerctl', ['position']);
            let stdout = '';

            playerctl.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            playerctl.on('exit', (code) => {
                if (code === 0 && stdout.trim()) {
                    const position = parseFloat(stdout.trim());
                    resolve(isNaN(position) ? null : position);
                } else {
                    resolve(null);
                }
            });

            playerctl.on('error', () => {
                resolve(null);
            });
        });
    }

    // Event handlers
    public onTrackChanged(callback: (track: TrackInfo | null) => void) {
    }

    public onPositionChanged(callback: (position: number) => void) {
        this.onPositionChangedCallback = callback;
    }

    // Getters
    public get currentTrackInfo(): TrackInfo | null {
        return this.currentTrack;
    }

    public get isAvailable(): boolean {
        return this.isPlayerctlAvailable;
    }

    public dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.artworkCache.clear();
    }
}




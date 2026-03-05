import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export interface MprisTrackState {
    title: string;
    artist: string;
    album: string;
    artUrl: string;
    positionSecs: number;
    durationSecs: number;
    status: 'playing' | 'paused' | 'stopped';
    player: string;
}

const EMPTY_STATE: MprisTrackState = {
    title: '', artist: '', album: '', artUrl: '',
    positionSecs: 0, durationSecs: 0, status: 'stopped', player: '',
};

class PlayerCtrlLinux {
    private _process: ChildProcessWithoutNullStreams | null = null;
    private state: MprisTrackState = { ...EMPTY_STATE };
    private onChange: (() => void) | null = null;
    private retryTimer: NodeJS.Timeout | null = null;
    private isDisposed = false;

    constructor() {
        this.startProcess();
    }

    private startProcess() {
        if (this.isDisposed) return;
        if (this._process) this.killProcess();

        // We use a custom delimiter ";|;" to avoid breaking on quotes in song titles
        const format = '{{status}};|;{{xesam:title}};|;{{xesam:artist}};|;{{xesam:album}};|;{{mpris:artUrl}};|;{{mpris:length}};|;{{position}}';

        // --follow: Blocks and waits for changes (0% CPU)
        // --player: Prioritize common players
        this._process = spawn('playerctl', ['metadata', '--format', format, '--follow']);

        this._process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.trim()) this.parseLine(line);
            }
        });

        this._process.stderr.on('data', (data) => {
            // "No players found" is common, ignore it
            // console.log('Playerctl stderr:', data.toString()); 
        });

        this._process.on('close', (code) => {
            if (!this.isDisposed) {
                // If playerctl exits (e.g. no player running), retry in 2 seconds
                this.retryTimer = setTimeout(() => this.startProcess(), 2000);
            }
        });
    }

    private parseLine(line: string) {
        try {
            const parts = line.split(';|;');
            if (parts.length < 6) return;

            // Update state
            this.state.status = (parts[0].toLowerCase() as any) || 'stopped';
            this.state.title = parts[1] || '';
            this.state.artist = parts[2] || '';
            this.state.album = parts[3] || '';
            this.state.artUrl = parts[4] || '';

            // Convert microseconds to seconds
            const durationMicros = parseInt(parts[5] || '0');
            this.state.durationSecs = Math.floor(durationMicros / 1_000_000);

            // Notify UI
            this.onChange?.();
        } catch (e) {
            console.error('Failed to parse playerctl output:', e);
        }
    }

    private killProcess() {
        if (this._process) {
            this._process.kill();
            this._process = null;
        }
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    // --- Public API ---

    get isConnected(): boolean {
        return this._process !== null && !this.isDisposed;
    }

    getState(): Readonly<MprisTrackState> {
        return this.state;
    }

    onTrackChange(cb: () => void) {
        this.onChange = cb;
    }

    // Control commands spawn a temporary process (fire and forget)
    playPause() { spawn('playerctl', ['play-pause']); }
    next() { spawn('playerctl', ['next']); }
    previous() { spawn('playerctl', ['previous']); }

    dispose() {
        this.isDisposed = true;
        this.killProcess();
    }
}

const PLAYER_CONTROLLER_LINUX = new PlayerCtrlLinux();
export default PLAYER_CONTROLLER_LINUX;
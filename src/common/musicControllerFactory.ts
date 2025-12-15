import * as vscode from 'vscode';
import * as os from 'os';
import { IMusicController } from './models/models';
import LinuxMusicController from '../linux';
import WindowsMusicController from '../windows';

export class MusicControllerFactory {
    /**
     * Creates a platform-specific music controller instance
     */
    public static create(context: vscode.ExtensionContext, webview: vscode.Webview | undefined): IMusicController {
        const platform = os.platform();

        console.log(`🎵 Initializing music controller for platform: ${platform}`);

        switch (platform) {
            case 'linux':
                return new LinuxMusicController(context);
            case 'win32':
                return new WindowsMusicController(context, webview);
            default:
                console.warn(`⚠️ Platform ${platform} not fully supported, defaulting to Windows controller`);
                return new WindowsMusicController(context);
        }
    }
}
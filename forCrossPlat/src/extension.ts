import * as vscode from 'vscode';
import { MusicController } from './musicController';

let musicController: MusicController;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cross-Platform Music extension is now active!');

    // Initialize the music controller
    musicController = new MusicController(context);

    // Add to extension context for proper disposal
    context.subscriptions.push(musicController);

    console.log('Music controller initialized');
}

export function deactivate() {
    if (musicController) {
        musicController.dispose();
    }
    console.log('Cross-Platform Music extension deactivated');
}

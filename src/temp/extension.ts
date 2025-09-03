// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MusicController } from './utils/musicController';

let musicController: MusicController | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('VS Music extension is now active!');

	try {
		// Initialize the music controller
		musicController = new MusicController(context);

		// Add the controller to disposables so it gets cleaned up properly
		context.subscriptions.push({
			dispose: () => {
				if (musicController) {
					musicController.dispose();
					musicController = undefined;
				}
			}
		});

		console.log('Music controller initialized successfully');

		// Show a welcome message
		vscode.window.showInformationMessage('VS Music is ready! Music info will appear in the status bar when playing.');

	} catch (error) {
		console.error('Failed to initialize VS Music extension:', error);
		vscode.window.showErrorMessage('Failed to initialize VS Music extension. Please check the console for details.');
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (musicController) {
		musicController.dispose();
		musicController = undefined;
	}
	console.log('VS Music extension deactivated');
}

/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import PLAYER_CONTROLLER_LINUX from './linux/utils/playerctl';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('VS Music extension is now active!');

	// Set the extension context for the player controller
	PLAYER_CONTROLLER_LINUX.setExtensionContext(context);

	console.log('Music controller initialized successfully');
	const isPlayerCtrlAvailable = await PLAYER_CONTROLLER_LINUX.isPlyerCtrlAvailable();
	if (isPlayerCtrlAvailable) {
		console.log('Playerctl is available on this system.');
		console.log("Current playing music metadata is");
		const trackInfo = await PLAYER_CONTROLLER_LINUX.getCurrentTrackInfo();
		console.log(trackInfo);

		console.log("Testing python script execution");
		await PLAYER_CONTROLLER_LINUX.testPy();


	}

	// Show a welcome message
	vscode.window.showInformationMessage('VS Music is ready! Music info will appear in the status bar when playing.');

}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('VS Music extension deactivated');
}

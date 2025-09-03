const path = require('path');
import * as vscode from 'vscode';
class FindFilePaths {
    getPath(
        extensionContext: vscode.ExtensionContext | null,
        fileName: string
    ): string {


        // Get the extension's root directory
        let filePath: string;

        if (extensionContext) {
            // Use extension context to get the proper path
            filePath = path.join(extensionContext.extensionPath, fileName);
            console.log("Using extension context path: " + filePath);
        } else {
            // Fallback to workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                filePath = path.join(workspaceFolders[0].uri.fsPath, 'test.py');
                console.log("Using workspace folder path: " + filePath);
            } else {
                // Last resort - try current working directory
                filePath = './test.py';
                console.log("Using current directory path: " + filePath);
            }
        }
        return filePath;
    }
}

const FIND_FILE_PATHS = new FindFilePaths();
export default FIND_FILE_PATHS;
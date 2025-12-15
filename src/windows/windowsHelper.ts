import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { readFile, readFileSync } from "fs";
import path from "path";
import vscode from "vscode";

const exe = path.join(__dirname, "src/windows/QuazaarMedia.exe");

// Variable to hold the process
export let winHelper: ChildProcessWithoutNullStreams | null = null;
let globleWebViewContext: vscode.ExtensionContext | undefined;
let vscodeWebview: vscode.Webview | undefined;

export const startHelper = () => {
    // Spawn the exe
    const wb = spawn(exe);
    winHelper = wb;
    console.log("Starting the windows helper .....");

    // =========================================================
    // GLOBAL READ LOGIC (Handles all incoming data)
    // =========================================================
    let buffer = "";

    wb.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();

        // Split by newline because data might come in multiple pieces
        // or multiple messages might arrive at once.
        const lines = buffer.split("\n");

        // The last element is either an empty string (if ends in \n) 
        // or an incomplete chunk. Save it back to buffer.
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (line.trim()) {
                console.log("From the globle handler ....");
                onMessageReceived(line.trim());
            }
        }
    });

    wb.stderr.on("data", (data) => {
        console.error("Helper Error:", data.toString());
    });

    // Use 'close', not 'disconnect'. 'disconnect' is only for Node IPC.
    wb.on("close", (code) => {
        console.log(`wb exited with code ${code}`);
        winHelper = null;
    });
};

// This function decides what to do when the exe speaks
const onMessageReceived = (response: string) => {
    try {
        const res = JSON.parse(response);
        console.log("Got response:", res);
        if (vscodeWebview && res["Title"]) {
            console.log("Got music info updating ....");

            //  updateTrack(message.track, artworkToUse, message.position, message.showProgressBar);
            const curateTrack = {
                title: res["Title"],
                artist: res["Artist"],
                album: res["Album"],
                status: res["Status"],
                artworkUri: res["ArtworkUri"]
            };

            return vscodeWebview.postMessage({
                command: 'updateTrack',
                track: curateTrack,
                artworkUri: handleArtwork(res["ArtworkUri"])
            });
        }
        console.log("Got incorrect music info .....", res["Title"]);

        return JSON.parse(response);
    } catch (err) {
        console.error("Error processing response:", err);
    }
};

// =========================================================
// SEND LOGIC (Only writes, does not wait)
// =========================================================
export const handleWinMessage = (
    message: string,
    context: vscode.ExtensionContext | undefined,
    webview: vscode.Webview | undefined
) => {
    if (winHelper && winHelper.stdin.writable) {
        globleWebViewContext = context;
        if (!vscodeWebview) {
            vscodeWebview = webview;
        }
        // Log the outgoing message for debugging
        console.log("Sending msg:", message);

        // Always add \n so the exe knows the command is finished
        winHelper.stdin.write(message + "\n"); // 
        // No need to wait for a response here
    } else {
        globleWebViewContext = undefined;
        console.error("Windows helper is not running or not writable.");
    }
};

let CurrentArtworkUri: string = "";
let imageBytes = "";
const handleArtwork = (uri: string) => {

    if (CurrentArtworkUri === uri && imageBytes) { return imageBytes; };

    const buff = readFileSync(uri, {}); // reading image file with no parameters
    const data = buff.toString("base64"); //converting to string with base 64 encoding
    if (!data) return "";
    imageBytes = "data:image/jpeg;base64," + data; //the header is stick to /jpeg coz from the QuazaarMedia.exe it only returns the .jpg format image  
    return imageBytes;
};
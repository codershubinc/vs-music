import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as fs from "fs";
import path from "path";
import vscode from "vscode";

const exe = path.join(__dirname, "src/windows/QuazaarMedia.exe");

// Variable to hold the process
export let winHelper: ChildProcessWithoutNullStreams | null = null;
let globleWebViewContext: vscode.ExtensionContext | undefined;
let vscodeWebview: vscode.Webview | undefined;

export const startHelper = () => {
    if (winHelper) {
        return;
    }

    console.log("Starting the windows helper .....");
    // Spawn the exe
    const wb = spawn(exe);
    winHelper = wb;

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

    wb.on("error", (err) => {
        console.error("Helper process error:", err);
        winHelper = null;
    });

    // Use 'close', not 'disconnect'. 'disconnect' is only for Node IPC.
    wb.on("close", (code) => {
        console.log(`wb exited with code ${code}`);
        winHelper = null;
    });
};

export const stopHelper = () => {
    if (winHelper) {
        try {
            winHelper.kill();
        } catch (err) {
            console.error("Error killing helper process:", err);
        }
        winHelper = null;
    }
    lastTrackState = null;
    CurrentArtworkUri = "";
    cachedArtworkUri = "";
};

interface TrackState {
    title: string;
    artist: string;
    album: string;
    status: string;
    artworkUri: string;
}

let lastTrackState: TrackState | null = null;

// This function decides what to do when the exe speaks
const onMessageReceived = async (response: string) => {
    try {
        const res = JSON.parse(response);
        console.log("Got response:", res);
        if (vscodeWebview && res["Title"]) {
            console.log("Got music info updating ....");

            const title = res["Title"] || "";
            const artist = res["Artist"] || "";
            const album = res["Album"] || "";
            const status = res["Status"] || "";
            const artworkUri = res["ArtworkUri"] || "";

            if (
                lastTrackState &&
                lastTrackState.title === title &&
                lastTrackState.artist === artist &&
                lastTrackState.album === album &&
                lastTrackState.status === status &&
                lastTrackState.artworkUri === artworkUri
            ) {
                return;
            }

            lastTrackState = { title, artist, album, status, artworkUri };

            const resolvedArtworkUri = await handleArtwork(artworkUri);

            const curateTrack = {
                title,
                artist,
                album,
                status,
                artworkUri
            };

            await vscodeWebview.postMessage({
                command: 'updateTrack',
                track: curateTrack,
                artworkUri: resolvedArtworkUri
            });
            return;
        }
        console.log("Got incorrect music info .....", res["Title"]);
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
        winHelper.stdin.write(message + "\n");
        // No need to wait for a response here
    } else {
        globleWebViewContext = undefined;
        console.error("Windows helper is not running or not writable.");
    }
};

let CurrentArtworkUri: string = "";
let cachedArtworkUri: string = "";

const handleArtwork = async (uri: string): Promise<string> => {
    if (!uri) {
        return "";
    }

    if (CurrentArtworkUri === uri && cachedArtworkUri) {
        return cachedArtworkUri;
    }

    CurrentArtworkUri = uri;

    if (vscodeWebview) {
        try {
            cachedArtworkUri = vscodeWebview.asWebviewUri(vscode.Uri.file(uri)).toString();
            return cachedArtworkUri;
        } catch (err) {
            console.warn("Failed to convert artwork uri with asWebviewUri:", err);
        }
    }

    try {
        const buff = await fs.promises.readFile(uri);
        const data = buff.toString("base64");
        if (!data) {
            cachedArtworkUri = "";
            return "";
        }
        cachedArtworkUri = "data:image/jpeg;base64," + data;
        return cachedArtworkUri;
    } catch (err) {
        console.warn("Failed to read artwork file async:", err);
        cachedArtworkUri = "";
        return "";
    }
};

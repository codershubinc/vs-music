import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

/**
 * Cache entry for LRU eviction
 */
interface CacheEntry {
    uri: string;
    size: number;
    lastAccess: number;
}

/**
 * Utility class for handling music artwork downloads and caching with LRU eviction
 */
export class ArtworkUtil {
    private static artworkCache = new Map<string, CacheEntry>();
    private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
    private static readonly MAX_CACHE_ENTRIES = 200;
    private static currentCacheSize = 0;
    private static extensionContext: vscode.ExtensionContext;

    /**
     * Initialize the artwork utility with extension context
     */
    public static initialize(context: vscode.ExtensionContext): void {
        this.extensionContext = context;
    }

    /**
     * Downloads and caches artwork with LRU eviction, validation, and retry logic
     * @param artUrl The artwork URL (file://, http://, or https://)
     * @returns Promise<string | null> Local file URI or null if failed
     */
    public static async downloadArtwork(artUrl: string): Promise<string | null> {
        if (!artUrl || !this.extensionContext) {
            return null;
        }

        try {
            // Check cache first and update LRU
            const cached = this.artworkCache.get(artUrl);
            if (cached) {
                cached.lastAccess = Date.now();
                return cached.uri;
            }

            // Handle file:// URLs by copying to extension storage
            if (artUrl.startsWith('file://')) {
                return this.handleFileUrl(artUrl);
            }

            // Handle HTTP/HTTPS URLs
            if (artUrl.startsWith('http://') || artUrl.startsWith('https://')) {
                return this.handleHttpUrl(artUrl);
            }

            // Skip unsupported URLs
            return null;

        } catch (error) {
            console.error('Error downloading artwork:', error);
            return null;
        }
    }

    /**
     * Handle file:// URLs with async operations and validation
     */
    private static async handleFileUrl(artUrl: string): Promise<string | null> {
        const sourcePath = artUrl.replace('file://', '');

        // Check if source file exists (async)
        try {
            await fs.promises.access(sourcePath);
        } catch {
            return null;
        }

        // Create artwork directory in extension's global storage
        const artworkDir = await this.getArtworkDirectory();

        // Generate filename from source path hash
        const pathHash = Buffer.from(sourcePath).toString('base64').replace(/[/+=]/g, '_');
        const extension = path.extname(sourcePath) || '.jpg';
        const filename = `artwork_${pathHash}${extension}`;
        const localPath = path.join(artworkDir, filename);

        // Copy file if not already copied (async)
        try {
            await fs.promises.access(localPath);
        } catch {
            await fs.promises.copyFile(sourcePath, localPath);
        }

        // Validate image
        const isValid = await this.validateImage(localPath);
        if (!isValid) {
            console.warn('Invalid image file, removing:', artUrl);
            try {
                await fs.promises.unlink(localPath);
            } catch (error) {
                console.error('Failed to delete invalid image:', error);
            }
            return null;
        }

        // Get file size and enforce cache limits
        const stats = await fs.promises.stat(localPath);
        await this.enforceCacheLimits(stats.size);

        const vscodeUri = vscode.Uri.file(localPath).toString();

        // Add to cache with metadata
        this.artworkCache.set(artUrl, {
            uri: vscodeUri,
            size: stats.size,
            lastAccess: Date.now()
        });
        this.currentCacheSize += stats.size;

        return vscodeUri;
    }

    /**
     * Handle HTTP/HTTPS URLs with retry logic and validation
     */
    private static async handleHttpUrl(artUrl: string): Promise<string | null> {
        // Create artwork directory in extension's global storage
        const artworkDir = await this.getArtworkDirectory();

        // Generate filename from URL hash
        const urlHash = Buffer.from(artUrl).toString('base64').replace(/[/+=]/g, '_');
        const filename = `artwork_${urlHash}.jpg`;
        const localPath = path.join(artworkDir, filename);

        // Check if already downloaded (async)
        try {
            await fs.promises.access(localPath);
            const stats = await fs.promises.stat(localPath);
            const vscodeUri = vscode.Uri.file(localPath).toString();

            // Update cache with existing file
            this.artworkCache.set(artUrl, {
                uri: vscodeUri,
                size: stats.size,
                lastAccess: Date.now()
            });

            return vscodeUri;
        } catch {
            // File doesn't exist, need to download
        }

        // Download with retry logic
        try {
            await this.downloadWithRetry(artUrl, localPath);
        } catch (error) {
            console.error('Error downloading artwork after retries:', error);
            return null;
        }

        // Validate the downloaded image
        const isValid = await this.validateImage(localPath);
        if (!isValid) {
            console.warn('Invalid image downloaded, removing:', artUrl);
            try {
                await fs.promises.unlink(localPath);
            } catch (error) {
                console.error('Failed to delete invalid image:', error);
            }
            return null;
        }

        // Get file size and enforce cache limits
        const stats = await fs.promises.stat(localPath);
        await this.enforceCacheLimits(stats.size);

        const vscodeUri = vscode.Uri.file(localPath).toString();

        // Add to cache with metadata
        this.artworkCache.set(artUrl, {
            uri: vscodeUri,
            size: stats.size,
            lastAccess: Date.now()
        });
        this.currentCacheSize += stats.size;

        return vscodeUri;
    }

    /**
     * Validate that a file is actually an image by checking magic bytes
     */
    private static async validateImage(filePath: string): Promise<boolean> {
        try {
            const fileBuffer = await fs.promises.readFile(filePath);

            if (fileBuffer.length < 4) {
                return false;
            }

            const magicBytes = fileBuffer.slice(0, 4);

            // PNG: 89 50 4E 47
            if (magicBytes[0] === 0x89 &&
                magicBytes[1] === 0x50 &&
                magicBytes[2] === 0x4E &&
                magicBytes[3] === 0x47) {
                return true;
            }

            // JPEG: FF D8 FF
            if (magicBytes[0] === 0xFF &&
                magicBytes[1] === 0xD8 &&
                magicBytes[2] === 0xFF) {
                return true;
            }

            // WebP: 52 49 46 46 (RIFF)
            if (magicBytes[0] === 0x52 &&
                magicBytes[1] === 0x49 &&
                magicBytes[2] === 0x46 &&
                magicBytes[3] === 0x46) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Image validation failed:', error);
            return false;
        }
    }

    /**
     * Enforce cache size and entry limits using LRU eviction
     */
    private static async enforceCacheLimits(newEntrySize: number): Promise<void> {
        while (
            this.artworkCache.size >= this.MAX_CACHE_ENTRIES ||
            this.currentCacheSize + newEntrySize > this.MAX_CACHE_SIZE
        ) {
            const oldest = this.findOldestEntry();
            if (!oldest) {
                break;
            }

            const entry = this.artworkCache.get(oldest)!;

            // Delete file from disk
            try {
                const filePath = vscode.Uri.parse(entry.uri).fsPath;
                await fs.promises.unlink(filePath);
            } catch (error) {
                console.warn('Failed to delete cached artwork:', error);
            }

            // Remove from cache
            this.artworkCache.delete(oldest);
            this.currentCacheSize -= entry.size;
        }
    }

    /**
     * Find the least recently used cache entry
     */
    private static findOldestEntry(): string | null {
        let oldest: [string, CacheEntry] | null = null;

        for (const [key, entry] of this.artworkCache.entries()) {
            if (!oldest || entry.lastAccess < oldest[1].lastAccess) {
                oldest = [key, entry];
            }
        }

        return oldest ? oldest[0] : null;
    }

    /**
     * Download file with retry logic and exponential backoff
     */
    private static async downloadWithRetry(url: string, dest: string, maxRetries: number = 3): Promise<void> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.downloadFile(url, dest);
                return;
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));

                console.log(`Retry ${attempt}/${maxRetries} for artwork: ${url}`);
            }
        }
    }

    /**
     * Download file from HTTP/HTTPS URL
     */
    private static downloadFile(url: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https://') ? https : http;
            const fileStream = fs.createWriteStream(dest);

            protocol.get(url, (response) => {
                if (response.statusCode !== 200) {
                    fileStream.close();
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });

                fileStream.on('error', (err) => {
                    fileStream.close();
                    fs.unlink(dest, () => reject(err));
                });
            }).on('error', (err) => {
                fileStream.close();
                fs.unlink(dest, () => reject(err));
            });
        });
    }

    /**
     * Get or create artwork directory (async)
     */
    private static async getArtworkDirectory(): Promise<string> {
        const artworkDir = path.join(this.extensionContext.globalStorageUri.fsPath, 'artwork');
        try {
            await fs.promises.access(artworkDir);
        } catch {
            await fs.promises.mkdir(artworkDir, { recursive: true });
        }
        return artworkDir;
    }

    /**
     * Clear all cached artwork and clean up disk space
     */
    public static async dispose(): Promise<void> {
        const entriesToDelete = Array.from(this.artworkCache.entries());

        for (const [, entry] of entriesToDelete) {
            try {
                const filePath = vscode.Uri.parse(entry.uri).fsPath;
                await fs.promises.unlink(filePath);
            } catch (error) {
                console.warn('Failed to delete artwork during cleanup:', error);
            }
        }

        this.artworkCache.clear();
        this.currentCacheSize = 0;
    }

    /**
     * Clear artwork cache (memory only)
     */
    public static clearCache(): void {
        this.artworkCache.clear();
        this.currentCacheSize = 0;
    }

    /**
     * Get cached artwork URI if exists
     */
    public static getCachedArtwork(artUrl: string): string | null {
        const entry = this.artworkCache.get(artUrl);
        if (entry) {
            entry.lastAccess = Date.now();
            return entry.uri;
        }
        return null;
    }

    /**
     * Get cache statistics for debugging
     */
    public static getCacheStats(): { entries: number; sizeBytes: number; sizeMB: number } {
        return {
            entries: this.artworkCache.size,
            sizeBytes: this.currentCacheSize,
            sizeMB: Math.round(this.currentCacheSize / (1024 * 1024) * 100) / 100
        };
    }
}
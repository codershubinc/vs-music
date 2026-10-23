/* eslint-disable curly */

const ICONS = {
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    stop: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
    musicNote: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    statusPlay: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    statusPause: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    statusStop: '<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>',
};

// Fixed: Move lastStatus outside function scope so optimization actually works
let lastStatusIndicator = '';

function updateStatusIndicator(status) {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) {
        return;
    }

    if (status === lastStatusIndicator) { return; }
    lastStatusIndicator = status;

    statusIndicator.className = 'status-indicator';
    if (status === 'playing') {
        statusIndicator.classList.add('status-playing');
        statusIndicator.innerHTML = ICONS.statusPlay;
    } else if (status === 'paused') {
        statusIndicator.classList.add('status-paused');
        statusIndicator.innerHTML = ICONS.statusPause;
    } else {
        statusIndicator.classList.add('status-stopped');
        statusIndicator.innerHTML = ICONS.statusStop;
    }
}

function updatePlayPauseButton(status) {
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (!playPauseBtn) {
        return;
    }

    if (status === 'playing' || status === 'Playing') {
        playPauseBtn.innerHTML = ICONS.pause;
        playPauseBtn.title = 'Pause';
    } else {
        playPauseBtn.innerHTML = ICONS.play;
        playPauseBtn.title = 'Play';
    }
}

function showNoMusic() {
    const musicInfoEl = document.getElementById('music-info');
    const noMusicEl = document.getElementById('no-music');

    if (musicInfoEl) {
        musicInfoEl.classList.add('hidden');
    }
    if (noMusicEl) {
        noMusicEl.classList.remove('hidden');
    }

    lastTitle = '';
    lastArtworkUri = null;
    lastStatusIndicator = '';
}

let lastTitle = '';
let lastArtworkUri = null;
let backgroundOverlay = null;

function updateArtwork(artworkUri, title) {
    const cleanArtworkUri = artworkUri?.trim() || '';

    // Only skip if BOTH title and artworkUri match what is currently displayed
    if (lastTitle === title && lastArtworkUri === cleanArtworkUri) {
        return;
    }

    lastTitle = title;
    lastArtworkUri = cleanArtworkUri;

    const albumArt = document.getElementById('album-art');
    if (!albumArt) {
        return;
    }

    try {
        if (cleanArtworkUri) {
            albumArt.classList.add('loading');

            // Preload image before displaying
            const img = new Image();
            let retried = false;

            img.onload = () => {
                albumArt.classList.remove('loading');
                albumArt.innerHTML = `<img src="${cleanArtworkUri}" alt="Album artwork">`;
                updateBackgroundOverlay(cleanArtworkUri);
            };

            img.onerror = () => {
                if (!retried && cleanArtworkUri.startsWith('vscode-webview:')) {
                    retried = true;
                    // File might still be writing to disk, retry once after 250ms
                    setTimeout(() => {
                        img.src = cleanArtworkUri + (cleanArtworkUri.includes('?') ? '&' : '?') + 't=' + Date.now();
                    }, 250);
                    return;
                }
                console.warn('Failed to load artwork:', cleanArtworkUri);
                albumArt.classList.remove('loading');
                lastArtworkUri = '';
                clearArtwork();
            };

            // Start loading
            img.src = cleanArtworkUri;
        } else {
            clearArtwork();
        }
    } catch (error) {
        console.error('Error updating artwork:', error);
        albumArt.classList.remove('loading');
        clearArtwork();
    }
}

function updateBackgroundOverlay(artworkUri) {
    const musicContainer = document.querySelector('.music-container');
    if (!musicContainer) return;

    if (!backgroundOverlay) {
        backgroundOverlay = document.createElement('div');
        backgroundOverlay.className = 'background-overlay';
        musicContainer.insertBefore(backgroundOverlay, musicContainer.firstChild);
    }
    backgroundOverlay.style.backgroundImage = `url('${artworkUri}')`;
}

function clearArtwork() {
    const albumArt = document.getElementById('album-art');
    if (albumArt) albumArt.innerHTML = '<div class="artwork-placeholder">' + ICONS.musicNote + '</div>';
    if (backgroundOverlay) backgroundOverlay.style.backgroundImage = 'none';
}

// Add loading state functions
function showLoadingState() {
    const container = document.querySelector('.music-container');
    container?.classList.add('loading');

    // Add skeleton animation
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');

    if (trackTitle) { trackTitle.innerHTML = '<div class="skeleton-text"></div>'; }
    if (trackArtist) { trackArtist.innerHTML = '<div class="skeleton-text short"></div>'; }
}

function hideLoadingState() {
    const container = document.querySelector('.music-container');
    container?.classList.remove('loading');
}

export {
    ICONS,
    updateStatusIndicator,
    updatePlayPauseButton,
    showNoMusic,
    updateArtwork,
    showLoadingState,
    hideLoadingState,
};
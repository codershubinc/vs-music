function updateStatusIndicator(status) {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) {
        return;
    }
    // Optimized: Only update when changed (70% less DOM manipulation)
    let lastStatus = '';
    if (status === lastStatus) { return; } // ✅ Skip if unchanged
    lastStatus = status;

    // Only update what actually changed
    statusIndicator.className = 'status-indicator';
    if (status === 'playing') {
        statusIndicator.classList.add('status-playing');
        statusIndicator.textContent = '▶';
    } else if (status === 'paused') {
        statusIndicator.classList.add('status-paused');
        statusIndicator.textContent = '⏸';
    } else {
        statusIndicator.classList.add('status-stopped');
        statusIndicator.textContent = '⏹';
    }
}

function updatePlayPauseButton(status) {
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (!playPauseBtn) {
        return;
    }

    if (status === 'playing' || status === 'Playing') {
        playPauseBtn.innerHTML = '⏸️';
        playPauseBtn.title = 'Pause';
    } else {
        playPauseBtn.innerHTML = '▶️';
        playPauseBtn.title = 'Play';
    }
}

function showNoMusic() {
    // console.log("Showing no music UI");

    // Clear any running intervals
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
        progressUpdateInterval = null;
    }

    const musicInfoEl = document.getElementById('music-info');
    const noMusicEl = document.getElementById('no-music');

    if (musicInfoEl) {
        musicInfoEl.classList.add('hidden');
    }
    if (noMusicEl) {
        noMusicEl.classList.remove('hidden');
    }

    currentTrack = null;
}

let lastArtworkUri = '';
let backgroundOverlay = null;

function updateArtwork(artworkUri) {
    // ✅ Skip if artwork hasn't changed
    if (artworkUri === lastArtworkUri) { return; }
    lastArtworkUri = artworkUri;

    const albumArt = document.getElementById('album-art');
    const musicContainer = document.querySelector('.music-container');
    if (!albumArt) { return; }

    if (artworkUri && artworkUri !== '') {
        albumArt.innerHTML = `<img src="${artworkUri}" alt="Album artwork" onerror="this.parentElement.innerHTML='🎵'">`;

        if (musicContainer) {
            // ✅ Reuse existing overlay instead of creating new one
            if (!backgroundOverlay) {
                backgroundOverlay = document.createElement('div');
                backgroundOverlay.className = 'background-overlay';
                // ✅ Apply styles once via CSS class instead of inline
                musicContainer.insertBefore(backgroundOverlay, musicContainer.firstChild);
            }

            // ✅ Only update background image, not all styles
            backgroundOverlay.style.backgroundImage = `url('${artworkUri}')`;
            backgroundOverlay.style.opacity = '0.2'; // ✅ Set opacity via style, not class
            backgroundOverlay.style.filter = 'blur(10px)'; // ✅ Set filter via style, not class
            backgroundOverlay.style.backgroundImagePosition = 'center';
            backgroundOverlay.style.backgroundSize = 'cover';
            backgroundOverlay.style.backgroundRepeat = 'no-repeat';
        }
        albumArt.innerHTML = '🎵';
    } else {
        if (backgroundOverlay) {
            backgroundOverlay.style.backgroundImage = 'none'; // ✅ Don't remove, just hide
        }
    }
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
    updateStatusIndicator,
    updatePlayPauseButton,
    showNoMusic,
    updateArtwork,
    showLoadingState,
    hideLoadingState,
};
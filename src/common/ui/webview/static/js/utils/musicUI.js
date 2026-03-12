/* eslint-disable curly */

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

let lastTitle = '';
let backgroundOverlay = null;

function updateArtwork(artworkUri, title) {
    // console.log("Title current ::", title, "Prev  ::", lastTitle);


    if (lastTitle === title) return;

    lastTitle = title;

    const albumArt = document.getElementById('album-art');
    if (!albumArt) return;

    try {
        if (artworkUri?.trim()) {

            albumArt.classList.add('loading');

            // Preload image before displaying
            const img = new Image();

            img.onload = () => {

                albumArt.classList.remove('loading');
                albumArt.innerHTML = `<img src="${artworkUri}" alt="Album artwork">`;
                updateBackgroundOverlay(artworkUri);
            };

            img.onerror = () => {
                console.warn('Failed to load artwork:', artworkUri);
                albumArt.classList.remove('loading');
                clearArtwork();
            };

            // Start loading
            img.src = artworkUri;
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
    if (albumArt) albumArt.innerHTML = '🎵';
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
    updateStatusIndicator,
    updatePlayPauseButton,
    showNoMusic,
    updateArtwork,
    showLoadingState,
    hideLoadingState,
};
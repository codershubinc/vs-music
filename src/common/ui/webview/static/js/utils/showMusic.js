

function updateStatusIndicator(status) {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) {
        return;
    }

    // Remove existing status classes
    statusIndicator.className = 'status-indicator';

    // Add appropriate status class and icon
    if (status === 'playing') {
        statusIndicator.classList.add('status-playing');
        statusIndicator.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    } else if (status === 'paused') {
        statusIndicator.classList.add('status-paused');
        statusIndicator.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    } else {
        statusIndicator.classList.add('status-stopped');
        statusIndicator.innerHTML = '<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>';
    }
}


export {
    updateStatusIndicator,
};
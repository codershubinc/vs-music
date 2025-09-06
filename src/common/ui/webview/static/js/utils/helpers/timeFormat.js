// Helper function to format time in MM:SS format
function formatTime(seconds) {
    if (!seconds || seconds < 0) {
        return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


export {
    formatTime
};
using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Media.Control;
using QuazaarMedia.Utilities;

namespace QuazaarMedia.Services
{
    public class PlaybackControlService
    {
        public async Task ExecutePlaybackCommand(GlobalSystemMediaTransportControlsSession session, string action)
        {
            if (session == null)
            {
                LogError("No active media session");
                Console.WriteLine("{\"status\": \"error\", \"message\": \"no active session\"}");
                return;
            }

            try
            {
                switch (action)
                {
                    case "play_pause":
                        await session.TryTogglePlayPauseAsync();
                        break;
                    case "play":
                        await session.TryPlayAsync();
                        break;
                    case "pause":
                        await session.TryPauseAsync();
                        break;
                    case "next":
                        await session.TrySkipNextAsync();
                        break;
                    case "prev":
                        await session.TrySkipPreviousAsync();
                        break;
                    case "seek_forward":
                        await SeekForward(session);
                        break;
                    case "seek_backward":
                        await SeekBackward(session);
                        break;
                    case "seek":
                        // Expects "Position" in seconds (int or float)
                        // But CommandObj needs to support it.
                        // For now, basic support.
                        break;
                }
                Console.WriteLine("{\"status\": \"ok\"}");
            }
            catch (Exception ex)
            {
                var details = FormatExceptionDetails(ex);
                LogError($"Playback command error ({action}): {details}");
                Console.WriteLine($"{{\"status\": \"error\", \"message\": \"{JsonHelper.Escape(ex.Message)}\"}}");
            }
        }

        private async Task SeekForward(GlobalSystemMediaTransportControlsSession session)
        {
            try
            {
                var timeline = session.GetTimelineProperties();
                if (timeline != null)
                {
                    var newPos = timeline.Position.Add(TimeSpan.FromSeconds(10));
                    if (newPos > timeline.EndTime) newPos = timeline.EndTime;
                    await session.TryChangePlaybackPositionAsync(newPos.Ticks);
                }
            }
            catch (Exception ex)
            {
                var details = FormatExceptionDetails(ex);
                LogError($"SeekForward error: {details}");
            }
        }

        private async Task SeekBackward(GlobalSystemMediaTransportControlsSession session)
        {
            try
            {
                var timeline = session.GetTimelineProperties();
                if (timeline != null)
                {
                    var newPos = timeline.Position.Subtract(TimeSpan.FromSeconds(10));
                    if (newPos < TimeSpan.Zero) newPos = TimeSpan.Zero;
                    await session.TryChangePlaybackPositionAsync(newPos.Ticks);
                }
            }
            catch (Exception ex)
            {
                var details = FormatExceptionDetails(ex);
                LogError($"SeekBackward error: {details}");
            }
        }

        private static string FormatExceptionDetails(Exception ex)
        {
            var details = ex.GetType().Name;

            if (ex is System.Runtime.InteropServices.COMException comEx)
            {
                details += $" [HRESULT: 0x{comEx.HResult:X8}]";
            }

            if (!string.IsNullOrEmpty(ex.Message))
            {
                details += $" - {ex.Message}";
            }

            if (ex.InnerException != null)
            {
                details += $" | Inner: {ex.InnerException.GetType().Name}";
            }

            return details;
        }

        private static void LogError(string message)
        {
            try
            {
                string logPath = Path.Combine(Path.GetTempPath(), "sidecar.log");
                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
                File.AppendAllText(logPath, $"[{timestamp}] PlaybackControlService: {message}\n");
            }
            catch { /* Ignore logging errors */ }
        }
    }
}

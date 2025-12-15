using System;
using System.IO;
using Windows.Storage.Streams;

namespace QuazaarMedia.Utilities
{
    public static class ArtworkUriHelper
    {
        public static async Task<string> ExtractArtwork(IRandomAccessStreamReference thumbnail)
        {
            string artworkUri = "";
            if (thumbnail != null)
            {
                try
                {
                    var filePath = Path.Combine(Path.GetTempPath(), "quazaar_art.jpg");
                    using (var stream = await thumbnail.OpenReadAsync())
                    using (var readStream = stream.AsStreamForRead())
                    using (var fileStream = File.Create(filePath))
                    {
                        await readStream.CopyToAsync(fileStream);
                    }
                    artworkUri = filePath;
                }
                catch (Exception ex)
                {
                    LogError($"Extract artwork failed: {FormatExceptionDetails(ex)}");
                }
            }
            return artworkUri;
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
                File.AppendAllText(logPath, $"[{timestamp}] ArtworkHelper: {message}\n");
            }
            catch { /* Ignore logging errors */ }
        }
    }
}
using System;
using System.Threading.Tasks;
using Windows.Media.Control;
using QuazaarMedia.Services;
using QuazaarMedia.Utilities;

namespace QuazaarMedia
{
    public class MediaController
    {
        private GlobalSystemMediaTransportControlsSessionManager? _manager;
        private readonly PlaybackControlService _playbackService = new();
        private readonly MediaStatusService _statusService = new();
         

        public async Task InitializeAsync()
        {
            try
            {
                _manager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{{\"status\": \"error\", \"message\": \"Init Failed: {JsonHelper.Escape(ex.Message)}\"}}");
            }
        }

        internal async Task HandleCommand(CommandObj cmd)
        {
            try
            { 
                // Ensure manager exists
                if (_manager == null)
                {
                    try
                    {
                        _manager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"{{\"status\": \"error\", \"message\": \"Manager Retry Failed: {JsonHelper.Escape(ex.Message)}\"}}");
                    }
                }

                if (_manager == null)
                {
                    // If we still can't get manager, return error or idle
                    if (cmd.Action == "info") Console.WriteLine("{\"status\": \"idle\"}");
                    else Console.WriteLine("{\"status\": \"error\", \"message\": \"no manager\"}");
                    return;
                }

                var session = _manager.GetCurrentSession();

                if (cmd.Action == "info")
                {
                    await _statusService.GetAndPrintStatus(session);
                    return;
                }

                // Control commands
                await _playbackService.ExecutePlaybackCommand(session, cmd.Action ?? "");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{{\"status\": \"error\", \"message\": \"Command Error: {JsonHelper.Escape(ex.Message)} ({ex.GetType().Name})\"}}");
            }
        }
    }
}

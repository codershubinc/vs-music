using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace QuazaarMedia
{
    class Program
    {
        private static int _commandCount = 0;
        private static MediaController? _controller;

        static async Task Main(string[] args)
        {
            // Ensure console uses UTF8
            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            // Handshake for Go app
            Console.WriteLine("{\"status\": \"ready\"}");

            // Initialize controller
            _controller = new MediaController();
            await _controller.InitializeAsync();

            // Main command loop - Request/Response model
            await ReadCommands();
        }

        static async Task ReadCommands()
        {
            while (true)
            {
                string? line = null;
                try
                {
                    line = await Console.In.ReadLineAsync();
                }
                catch (Exception ex)
                {
                    LogError($"Failed to read input: {FormatExceptionDetails(ex)}");
                    break;
                }

                if (line == null)
                {
                    break;
                }

                try
                {
                    // Use Source Generator Context for deserialization
                    var cmd = JsonSerializer.Deserialize(line, AppJsonContext.Default.CommandObj);
                    if (cmd != null && _controller != null)
                    {
                        await _controller.HandleCommand(cmd);
                    }
                }
                catch (JsonException ex)
                {
                    LogError($"JSON parse error: {FormatExceptionDetails(ex)}");
                    Console.WriteLine("{\"status\": \"error\", \"message\": \"json parse error\"}");
                }
                catch (Exception ex)
                {
                    LogError($"Command processing error: {FormatExceptionDetails(ex)}");
                    var msg = ex.Message.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
                    Console.WriteLine($"{{\"status\": \"error\", \"message\": \"{msg}\"}}");
                }

                // Periodic GC to keep memory low
                _commandCount++;
                if (_commandCount > 10)
                {
                    _commandCount = 0;
                    GC.Collect();
                }
            }
        }

        static void LogError(string message)
        {
            try
            {
                string logPath = Path.Combine(Path.GetTempPath(), "sidecar.log");
                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
                File.AppendAllText(logPath, $"[{timestamp}] Program: {message}\n");
            }
            catch { /* Ignore logging errors */ }
        }

        static string FormatExceptionDetails(Exception ex)
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
    }
}

using System.Text.Json.Serialization;

namespace QuazaarMedia
{
    public class CommandObj
    {
        public string? Action { get; set; }
        public long Position { get; set; } // For seek
        public int Level { get; set; } // For volume
    }

    [JsonSerializable(typeof(CommandObj))]
    internal partial class AppJsonContext : JsonSerializerContext
    {
    }
}

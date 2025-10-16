using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Emsi.Models
{
  public class TitleResponse
  {
    [JsonProperty("data")]
    public Title[] Data { get; set; } = null!;
  }

  public class Title
  {
    [JsonProperty("id")]
    public string Id { get; set; } = null!;
    [JsonProperty("name")]
    public string Name { get; set; } = null!;
  }

}

using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Emsi.Models
{
  public class TitleResponse
  {
    [JsonProperty("data")]
    public Title[] Data { get; set; }
  }

  public class Title
  {
    [JsonProperty("id")]
    public string Id { get; set; }
    [JsonProperty("name")]
    public string Name { get; set; }
  }

}

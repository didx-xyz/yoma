using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Emsi.Models
{
  public class SkillResponse
  {
    [JsonProperty("attributions")]
    public Attribution[] Attributions { get; set; } = null!;
    [JsonProperty("data")]
    public Skill[] Data { get; set; } = null!;
  }

  public class Attribution
  {
    [JsonProperty("name")]
    public string Name { get; set; } = null!;
    [JsonProperty("text")]
    public string Text { get; set; } = null!;
  }

  public class Skill
  {
    [JsonProperty("id")]
    public string Id { get; set; } = null!;
    [JsonProperty("name")]
    public string Name { get; set; } = null!;
    [JsonProperty("type")]
    public SkillType Type { get; set; } = null!;
    [JsonProperty("infoUrl")]
    public string InfoUrl { get; set; } = null!;
  }

  public class SkillType
  {
    [JsonProperty("id")]
    public string Id { get; set; } = null!;
    [JsonProperty("name")]
    public string Name { get; set; } = null!;
  }

}

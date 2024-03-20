using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Emsi.Models
{
  public class SkillResponse
  {
    [JsonProperty("attributions")]
    public Attribution[] Attributions { get; set; }
    [JsonProperty("data")]
    public Skill[] Data { get; set; }
  }

  public class Attribution
  {
    [JsonProperty("name")]
    public string Name { get; set; }
    [JsonProperty("text")]
    public string Text { get; set; }
  }

  public class Skill
  {
    [JsonProperty("id")]
    public string Id { get; set; }
    [JsonProperty("name")]
    public string Name { get; set; }
    [JsonProperty("type")]
    public SkillType Type { get; set; }
    [JsonProperty("infoUrl")]
    public string InfoUrl { get; set; }
  }

  public class SkillType
  {
    [JsonProperty("id")]
    public string Id { get; set; }
    [JsonProperty("name")]
    public string Name { get; set; }
  }

}

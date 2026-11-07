namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class CredentialPreset
  {
    public string Id { get; set; } = null!;

    public string Author { get; set; } = null!;

    public string Code { get; set; } = null!;

    public string CredentialFormat { get; set; } = null!;

    public string TemplateName { get; set; } = null!;

    public string TemplateType { get; set; } = null!;

    public Dictionary<string, CredentialAttribute> TemplateAttributes { get; set; } = null!;
  }
}

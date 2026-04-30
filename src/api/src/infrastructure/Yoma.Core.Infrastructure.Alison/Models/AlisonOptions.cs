namespace Yoma.Core.Infrastructure.Alison.Models
{
  public sealed class AlisonOptions
  {
    public const string Section = "Alison";

    public string AccessTokenPath { get; set; } = "access-token";

    public string RefreshTokenPath { get; set; } = "refresh-token";

    public string CoursesPath { get; set; } = "courses";

    public string BaseUrl { get; set; } = null!;

    public string ClientId { get; set; } = null!;

    public string ClientSecret { get; set; } = null!;

    public string OrganizationId { get; set; } = null!;

    public string OrganizationKey { get; set; } = null!;

    public Guid OrganizationIdYoma { get; set; }
  }
}

namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class TenantRequest
  {
    public string Referent { get; set; } = null!;

    public string Name { get; set; } = null!;

    public List<Role> Roles { get; set; } = null!;

    public string? ImageUrl { get; set; }
  }
}

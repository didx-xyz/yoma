using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Extensions
{
  public static class OrganizationExtensions
  {
    public static OrganizationInfo ToInfo(this Organization value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new OrganizationInfo
      {
        Id = value.Id,
        Name = value.Name,
        Tagline = value.Tagline,
        Status = value.Status,
        LogoURL = value.LogoURL
      };
    }
  }
}

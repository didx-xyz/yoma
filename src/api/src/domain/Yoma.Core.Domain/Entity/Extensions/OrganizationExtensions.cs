using System.Runtime.CompilerServices;
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

    public static bool ContactInfoSet(this Organization value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      if (string.IsNullOrEmpty(value.PrimaryContactName)) return false;
      if (string.IsNullOrEmpty(value.PrimaryContactEmail)) return false;
      if (string.IsNullOrEmpty(value.PrimaryContactPhone)) return false;

      return true;
    }

    public static bool AddressInfoSet(this Organization value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      if (string.IsNullOrEmpty(value.StreetAddress)) return false;
      if (string.IsNullOrEmpty(value.City)) return false;
      if (string.IsNullOrEmpty(value.Province)) return false;
      if (!value.CountryId.HasValue) return false;
      if (string.IsNullOrEmpty(value.PostalCode)) return false;
      return true;
    }
  }
}

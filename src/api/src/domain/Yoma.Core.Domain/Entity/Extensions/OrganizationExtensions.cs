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

    public static OrganizationInfoAdmin ToInfoAdmin(this Organization value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new OrganizationInfoAdmin
      {
        Id = value.Id,
        Name = value.Name,
        Tagline = value.Tagline,
        Status = value.Status,
        LogoURL = value.LogoURL,
        ZltoRewardPool = value.ZltoRewardPool,
        ZltoRewardCumulative = value.ZltoRewardCumulative,
        ZltoRewardBalance = value.ZltoRewardBalance,
        YomaRewardPool = value.YomaRewardPool,
        YomaRewardCumulative = value.YomaRewardCumulative,
        YomaRewardBalance = value.YomaRewardBalance
      };
    }

    public static bool ContactInfoSet(this Organization value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      if (string.IsNullOrEmpty(value.PrimaryContactName)) return false;
      if (string.IsNullOrEmpty(value.PrimaryContactEmail)) return false;
      // omit phone numbers due to the complexity of global formatting and align Yoma's allowed formatting with SA Youth

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

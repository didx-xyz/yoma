using Flurl;

namespace Yoma.Core.Domain.Referral.Extensions
{
  public static class LinkExtensions
  {
    #region Public Members
    public static string ClaimURL(this Models.ReferralLink value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      if (value.Id == Guid.Empty) throw new ArgumentException("Id cannot be empty", nameof(value));

      return appBaseURL.AppendPathSegment($"referrals/claim").AppendPathSegment(value.Id.ToString());
    }
    #endregion
  }
}

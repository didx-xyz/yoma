namespace Yoma.Core.Infrastructure.Bitly
{
  public enum ShortLinkType
  {
    /// <summary>
    /// Bitly's generic domain, no customized back-half
    /// </summary>
    Generic,

    /// <summary>
    /// A custom domain, but no customized back-half
    /// </summary>
    CustomDomain,

    /// <summary>
    /// Bitly's generic domain, with a customized back-half
    /// </summary>
    CustomBackHalf,

    /// <summary>
    /// A custom domain and a customized back-half
    /// </summary>
    CustomDomainAndBackHalf,
  }
}

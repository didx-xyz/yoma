namespace Yoma.Core.Domain.ShortLinkProvider
{
  public enum ShortLinkType
  {
    /// <summary>
    /// Generic domain and no customized back-half
    /// </summary>
    Generic,

    /// <summary>
    /// Custom domain and no customized back-half
    /// </summary>
    CustomDomain,

    /// <summary>
    /// Generic domain and a customized back-half
    /// </summary>
    CustomBackHalf,

    /// <summary>
    /// Custom domain and a customized back-half
    /// </summary>
    CustomDomainAndBackHalf,
  }
}

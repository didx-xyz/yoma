namespace Yoma.Core.Infrastructure.IXO.YellowCard
{
  internal static class Constants
  {
    internal const string HeaderAuthorization = "Authorization";
    internal const string HeaderAuthorizationValuePrefix = "Bearer";
    internal const string WebhookSignatureVersion = "v1";
  }

  /// <summary>
  /// Header names defined by the IXO Yellow Card webhook authentication contract.
  /// The API transport and infrastructure parser share these values to avoid duplicating provider protocol details.
  /// </summary>
  public static class YellowCardWebhookHeaders
  {
    public const string Id = "webhook-id";
    public const string Timestamp = "webhook-timestamp";
    public const string Signature = "webhook-signature";
  }
}

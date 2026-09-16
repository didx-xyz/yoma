using Newtonsoft.Json;
using System.Globalization;

namespace Yoma.Core.Domain.Notification.Models
{
  /// <summary>
  /// Shared data for payout outcome templates. Each template owns its wording.
  /// No technical references, provider errors, temporary payment links or identity details are
  /// included. ZLTO comes from the actual reward transaction.
  /// </summary>
  public sealed class NotificationPayout : NotificationBase
  {
    #region Public Members
    [JsonProperty("amount")]
    public decimal Amount { get; set; }

    [JsonProperty("amountFormatted")]
    public string AmountFormatted => Amount.ToString("0.00", CultureInfo.InvariantCulture);

    [JsonProperty("currency")]
    public string Currency { get; set; } = null!;

    [JsonProperty("zltoAmount")]
    public decimal ZltoAmount { get; set; }

    [JsonProperty("zltoAmountFormatted")]
    public string ZltoAmountFormatted => ZltoAmount.ToString("0", CultureInfo.InvariantCulture);

    [JsonProperty("yoIDWalletURL")]
    public string YoIDWalletURL { get; set; } = null!;

    /// <summary>
    /// Variables for the short message templates documented on NotificationType:
    /// environment suffix and wallet link (WhatsApp button path or SMS inline URL).
    /// </summary>
    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType is not MessageType.SMS and not MessageType.WhatsApp)
        throw new NotSupportedException($"Only '{MessageType.SMS}' or '{MessageType.WhatsApp}' are supported");

      if (string.IsNullOrWhiteSpace(YoIDWalletURL))
        throw new InvalidOperationException("YoIDWalletURL is not set");

      var url = new Uri(YoIDWalletURL);
      var formattedUrl = messageType == MessageType.WhatsApp
        ? url.PathAndQuery.TrimStart('/')
        : url.ToString();

      return new Dictionary<string, string>
      {
        { "1", SubjectSuffix },
        { "2", formattedUrl }
      };
    }

    public override List<NotificationBase> FlattenItems() => [this];
    #endregion
  }
}

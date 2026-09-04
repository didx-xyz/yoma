using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Helpers;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;
using PayoutProvider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Services
{
  public sealed class YellowCardWebhookParser : IYellowCardWebhookParser
  {
    #region Class Variables
    private readonly ILogger<YellowCardWebhookParser> _logger;
    private readonly YellowCardOptions _options;
    #endregion

    #region Constructor
    public YellowCardWebhookParser(
      ILogger<YellowCardWebhookParser> logger,
      IOptions<YellowCardOptions> options)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
    }
    #endregion

    #region Public Members
    public YellowCardWebhookResult Parse(
      string requestBody,
      string? webhookId,
      string? webhookTimestamp,
      string? webhookSignature)
    {
      requestBody = NormalizeRequired(requestBody, nameof(requestBody), false);
      webhookId = NormalizeAuthenticationRequired(webhookId, YellowCardWebhookHeaders.Id);
      webhookTimestamp = NormalizeAuthenticationRequired(webhookTimestamp, YellowCardWebhookHeaders.Timestamp);
      webhookSignature = NormalizeAuthenticationRequired(webhookSignature, YellowCardWebhookHeaders.Signature);

      ValidateTimestamp(webhookTimestamp);
      ValidateSignature(requestBody, webhookId, webhookTimestamp, webhookSignature);

      var payload = JsonConvert.DeserializeObject<YellowCardWebhookEvent>(requestBody)
        ?? throw new JsonSerializationException("Yellow Card webhook payload is empty");

      payload.EventId = NormalizeRequired(payload.EventId, nameof(payload.EventId));
      if (!string.Equals(payload.EventId, webhookId, StringComparison.Ordinal))
        throw new ArgumentException("Yellow Card webhook event id does not match its signed header", nameof(requestBody));

      if (!Guid.TryParse(payload.YomaTransactionId, out var payoutId) || payoutId == Guid.Empty)
        throw new ArgumentException("Yellow Card webhook contains an invalid Yoma payout transaction id", nameof(requestBody));

      payload.ProviderTransactionId = NormalizeRequired(payload.ProviderTransactionId, nameof(payload.ProviderTransactionId));
      var status = YellowCardStatusHelper.ToPayoutStatus(payload.Status);

      if (!DateTimeOffset.TryParse(
          payload.OccurredAt,
          CultureInfo.InvariantCulture,
          DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
          out var occurredAt))
        throw new ArgumentException("Yellow Card webhook contains an invalid occurrence timestamp", nameof(requestBody));

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Authenticated IXO payout webhook event '{eventId}' for Yoma payout transaction '{payoutId}' with provider transaction '{providerTransactionId}' and status '{status}'",
          payload.EventId.SanitizeLogValue(), payoutId, payload.ProviderTransactionId.SanitizeLogValue(), status);

      return new YellowCardWebhookResult
      {
        EventId = payload.EventId,
        OccurredAt = occurredAt,
        PayoutStatus = new PayoutStatusResponse
        {
          Id = payoutId,
          Provider = PayoutProvider.YellowCard,
          TransactionId = payload.ProviderTransactionId,
          Status = status,
          ErrorReason = payload.ErrorReason?.Trim()
        }
      };
    }
    #endregion

    #region Private Members
    private void ValidateTimestamp(string webhookTimestamp)
    {
      if (!long.TryParse(webhookTimestamp, NumberStyles.None, CultureInfo.InvariantCulture, out var timestampSeconds))
        throw new UnauthorizedAccessException("Yellow Card webhook timestamp is invalid");

      DateTimeOffset timestamp;
      try
      {
        timestamp = DateTimeOffset.FromUnixTimeSeconds(timestampSeconds);
      }
      catch (ArgumentOutOfRangeException ex)
      {
        throw new UnauthorizedAccessException("Yellow Card webhook timestamp is invalid", ex);
      }

      var tolerance = TimeSpan.FromMinutes(_options.WebhookTimestampToleranceInMinutes);
      if ((DateTimeOffset.UtcNow - timestamp).Duration() > tolerance)
        throw new UnauthorizedAccessException("Yellow Card webhook timestamp is outside the permitted tolerance");
    }

    private void ValidateSignature(
      string requestBody,
      string webhookId,
      string webhookTimestamp,
      string webhookSignature)
    {
      var signedPayload = Encoding.UTF8.GetBytes($"{webhookId}.{webhookTimestamp}.{requestBody}");
      var secret = Encoding.UTF8.GetBytes(_options.WebhookSigningSecret);
      var expectedSignature = HMACSHA256.HashData(secret, signedPayload);

      var signatureValid = webhookSignature
        .Split([',', ' '], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Where(value => value.StartsWith($"{Constants.WebhookSignatureVersion}=", StringComparison.OrdinalIgnoreCase))
        .Select(value => value[(value.IndexOf('=') + 1)..])
        .Any(value => SignatureMatches(value, expectedSignature));

      if (!signatureValid)
        throw new UnauthorizedAccessException("Yellow Card webhook signature is invalid");
    }

    private static bool SignatureMatches(string signature, byte[] expectedSignature)
    {
      try
      {
        var providedSignature = Convert.FromHexString(signature);
        return providedSignature.Length == expectedSignature.Length &&
          CryptographicOperations.FixedTimeEquals(providedSignature, expectedSignature);
      }
      catch (FormatException)
      {
        return false;
      }
    }

    private static string NormalizeRequired(string? value, string parameterName, bool trim = true)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(parameterName);

      return trim ? value.Trim() : value;
    }

    private static string NormalizeAuthenticationRequired(string? value, string headerName)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new UnauthorizedAccessException($"Yellow Card webhook header '{headerName}' is required");

      return value.Trim();
    }
    #endregion
  }
}

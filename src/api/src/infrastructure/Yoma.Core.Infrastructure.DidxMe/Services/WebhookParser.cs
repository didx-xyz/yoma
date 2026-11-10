using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Verifies the unmodified Svix request before reading provider correlation. Repeated deliveries
  /// remain valid; the journal makes processing idempotent and persistence failures remain retryable.
  /// </summary>
  public class WebhookParser : IWebhookParser
  {
    #region Class Variables
    private const string SigningSecretPrefix = "whsec_";
    private const string SignaturePrefix = "v1,";
    private const string AcceptedEventType = "wallet.credential.accepted";
    private const string WalletReferencePrefix = "wallet";
    private const string CredentialReferenceType = "credential";
    private const string AcceptedReferenceState = "accepted";
    private readonly WebhookOptions _options;
    #endregion

    #region Constructor
    public WebhookParser(IOptions<ProviderOptions> options)
    {
      _options = (options ?? throw new ArgumentNullException(nameof(options))).Value.Webhook;
    }
    #endregion

    #region Public Members
    public WebhookResult? Parse(string body, string? id, string? timestamp, string? signature)
    {
      if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(signature) ||
        !long.TryParse(timestamp, NumberStyles.None, CultureInfo.InvariantCulture, out var seconds) ||
        Math.Abs((decimal)seconds - DateTimeOffset.UtcNow.ToUnixTimeSeconds()) > _options.TimestampToleranceSeconds)
        throw new UnauthorizedAccessException("Invalid or expired webhook authentication");

      if (string.IsNullOrWhiteSpace(_options.SigningSecret) || !_options.SigningSecret.StartsWith(SigningSecretPrefix, StringComparison.Ordinal))
        throw new InvalidOperationException("The webhook signing secret is not configured");

      byte[] key;
      try
      {
        key = Convert.FromBase64String(_options.SigningSecret[SigningSecretPrefix.Length..]);
      }
      catch (FormatException)
      {
        throw new InvalidOperationException("The webhook signing secret is invalid");
      }

      var expected = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"{id}.{timestamp}.{body}"));
      CryptographicOperations.ZeroMemory(key);
      var verified = false;
      foreach (var candidate in signature.Split(' ', StringSplitOptions.RemoveEmptyEntries))
      {
        if (!candidate.StartsWith(SignaturePrefix, StringComparison.Ordinal)) continue;
        try
        {
          verified |= CryptographicOperations.FixedTimeEquals(expected, Convert.FromBase64String(candidate[SignaturePrefix.Length..]));
        }
        catch (FormatException)
        {
          // A sender may provide multiple signatures during signing-key rotation.
        }
      }

      if (!verified) throw new UnauthorizedAccessException("Invalid webhook signature");

      var payload = JsonConvert.DeserializeObject<WebhookEvent>(body)
        ?? throw new ArgumentException("Webhook payload is missing");
      if (payload.EventType != AcceptedEventType) return null;

      var issuanceId = payload.Payload?.OpenId4VcIssuanceId;
      var eventReference = payload.Tracing?.ParadymWebhookId;
      var parts = eventReference?.Split(':');
      if (string.IsNullOrWhiteSpace(issuanceId) || parts?.Length != 4 || parts[0] != WalletReferencePrefix ||
        parts[1] != CredentialReferenceType || parts[3] != AcceptedReferenceState || !Guid.TryParse(parts[2], out var walletId))
        throw new ArgumentException("Accepted-wallet event has no valid issuance and wallet correlation");

      return new WebhookResult
      {
        EventId = id,
        IssuanceId = issuanceId,
        WalletCredentialId = walletId.ToString()
      };
    }
    #endregion
  }
}

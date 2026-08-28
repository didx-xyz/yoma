using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Globalization;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Helpers;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;
using PayoutProvider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Client
{
  public sealed class YellowCardClient : IPayoutProviderClient
  {
    #region Class Variables
    private readonly ILogger<YellowCardClient> _logger;
    private readonly YellowCardOptions _options;
    private readonly IYellowCardAuthService _authService;
    #endregion

    #region Constructor
    public YellowCardClient(
      ILogger<YellowCardClient> logger,
      YellowCardOptions options,
      IYellowCardAuthService authService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options ?? throw new ArgumentNullException(nameof(options));
      _authService = authService ?? throw new ArgumentNullException(nameof(authService));
    }
    #endregion

    #region Public Members
    public async Task<PayoutResponse> Initiate(PayoutRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ValidateConfiguration();
      Validate(request);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Initiating IXO hosted payout for Yoma payout transaction '{payoutId}'", request.TransactionId);

      var authHeader = await _authService.GetAuthHeader();
      var httpRequest = new YellowCardPayoutRequest
      {
        YomaTransactionId = request.TransactionId.ToString(),
        YomaUserId = request.UserId.ToString(),
        Username = request.Username,
        Email = request.Email,
        PhoneNumber = request.PhoneNumber,
        AmountInUSD = request.AmountInUSD,
        FirstName = request.FirstName,
        Surname = request.Surname,
        Country = request.CountryCodeAlpha2,
        Gender = request.Gender,
        DateOfBirth = request.DateOfBirth.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        EducationLevel = request.Education
      };

      var response = await Execute<YellowCardPayoutSessionResponse>(() =>
        _options.BaseUrl
          .AppendPathSegment(_options.PayoutsPath)
          .WithAuthHeader(authHeader)
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
          .PostJsonAsync(httpRequest),
        [HttpStatusCode.Created]);

      var result = ToPayoutResponse(response);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "IXO hosted payout initiated for Yoma payout transaction '{payoutId}' with provider transaction '{providerTransactionId}'",
          request.TransactionId, result.TransactionId);

      return result;
    }

    public async Task<PayoutSessionResponse> GetSession(PayoutSessionRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ValidateConfiguration();

      if (request.Id == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "Payout transaction id is empty");

      request.TransactionId = NormalizeRequired(request.TransactionId, nameof(request.TransactionId));

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting refreshed IXO hosted payout session for Yoma payout transaction '{payoutId}'", request.Id);

      var authHeader = await _authService.GetAuthHeader();
      var response = await Execute<YellowCardPayoutSessionResponse>(() =>
        _options.BaseUrl
          .AppendPathSegment(_options.PayoutsPath)
          .AppendPathSegment(request.Id.ToString())
          .AppendPathSegment("session")
          .WithAuthHeader(authHeader)
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
          .PostAsync());

      var providerTransactionId = NormalizeRequired(response.ProviderTransactionId, nameof(response.ProviderTransactionId));
      if (!string.Equals(providerTransactionId, request.TransactionId, StringComparison.Ordinal))
        throw new InvalidOperationException($"IXO provider transaction id mismatch for Yoma payout transaction '{request.Id}'");

      ValidateSessionStatus(response.Status);

      return new PayoutSessionResponse
      {
        PaymentUrl = NormalizePaymentUrl(response.PaymentUrl),
        ExpiresAt = ParseDateTimeOffset(response.ExpiresAt, nameof(response.ExpiresAt))
      };
    }

    public async Task<PayoutStatusResponse> GetStatus(PayoutStatusRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ValidateConfiguration();

      if (request.Id == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "Payout transaction id is empty");

      request.TransactionId = request.TransactionId?.Trim();

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting IXO payout status for Yoma payout transaction '{payoutId}'", request.Id);

      var authHeader = await _authService.GetAuthHeader();
      var response = await Execute<YellowCardPayoutStatusResponse>(() =>
        _options.BaseUrl
          .AppendPathSegment(_options.PayoutsPath)
          .AppendPathSegment(request.Id.ToString())
          .WithAuthHeader(authHeader)
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
          .GetAsync());

      if (!Guid.TryParse(response.YomaTransactionId, out var yomaTransactionId) || yomaTransactionId != request.Id)
        throw new InvalidOperationException($"IXO returned an invalid Yoma payout transaction reference for '{request.Id}'");

      var providerTransactionId = NormalizeRequired(response.ProviderTransactionId, nameof(response.ProviderTransactionId));
      if (!string.IsNullOrEmpty(request.TransactionId) &&
          !string.Equals(providerTransactionId, request.TransactionId, StringComparison.Ordinal))
        throw new InvalidOperationException($"IXO provider transaction id mismatch for Yoma payout transaction '{request.Id}'");

      return new PayoutStatusResponse
      {
        Id = request.Id,
        Provider = PayoutProvider.YellowCard,
        TransactionId = providerTransactionId,
        Status = YellowCardStatusHelper.ToPayoutStatus(response.Status),
        ErrorReason = response.ErrorReason?.Trim()
      };
    }
    #endregion

    #region Private Members
    private async Task<TResponse> Execute<TResponse>(
      Func<Task<IFlurlResponse>> request,
      List<HttpStatusCode>? additionalSuccessStatusCodes = null)
    {
      try
      {
        var response = await request().EnsureSuccessStatusCodeAsync(additionalSuccessStatusCodes);
        return await response.GetJsonAsync<TResponse>();
      }
      catch (HttpClientException ex)
      {
        throw MapException(ex);
      }
    }

    private static HttpClientException MapException(HttpClientException exception)
    {
      try
      {
        var error = JsonConvert.DeserializeObject<YellowCardErrorResponse>(exception.Message);
        var message = error?.Message?.Trim();
        var code = error?.Code?.Trim();

        if (!string.IsNullOrEmpty(message))
          return new HttpClientException(
            exception.StatusCode,
            string.IsNullOrEmpty(code) ? message : $"{message} ({code})");
      }
      catch (JsonException)
      {
        // Preserve the original response when IXO returns an unexpected error representation.
      }

      return exception;
    }

    private static PayoutResponse ToPayoutResponse(YellowCardPayoutSessionResponse response)
    {
      ArgumentNullException.ThrowIfNull(response);
      ValidateSessionStatus(response.Status);

      return new PayoutResponse
      {
        TransactionId = NormalizeRequired(response.ProviderTransactionId, nameof(response.ProviderTransactionId)),
        PaymentUrl = NormalizePaymentUrl(response.PaymentUrl),
        ExpiresAt = ParseDateTimeOffset(response.ExpiresAt, nameof(response.ExpiresAt))
      };
    }

    private static void Validate(PayoutRequest request)
    {
      if (request.TransactionId == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "Payout transaction id is empty");
      if (request.UserId == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "Yoma user id is empty");

      request.Username = NormalizeRequired(request.Username, nameof(request.Username));
      request.Email = NormalizeRequired(request.Email, nameof(request.Email));
      request.PhoneNumber = request.PhoneNumber?.Trim();
      request.FirstName = NormalizeRequired(request.FirstName, nameof(request.FirstName));
      request.Surname = NormalizeRequired(request.Surname, nameof(request.Surname));
      request.CountryCodeAlpha2 = NormalizeRequired(request.CountryCodeAlpha2, nameof(request.CountryCodeAlpha2)).ToUpperInvariant();
      request.Gender = NormalizeRequired(request.Gender, nameof(request.Gender));
      request.Education = request.Education?.Trim();

      if (request.CountryCodeAlpha2.Length != 2)
        throw new ArgumentException("Country code must be an ISO 3166-1 alpha-2 value", nameof(request));
      if (request.DateOfBirth == default)
        throw new ArgumentNullException(nameof(request), "Date of birth is empty");
      if (request.AmountInUSD <= default(decimal))
        throw new ArgumentOutOfRangeException(nameof(request), "Payout amount must be greater than zero");
    }

    private void ValidateConfiguration()
    {
      ValidateHttpsUrl(_options.BaseUrl, nameof(_options.BaseUrl));
      NormalizeRequired(_options.AccessTokenPath, nameof(_options.AccessTokenPath));
      NormalizeRequired(_options.PayoutsPath, nameof(_options.PayoutsPath));
      NormalizeRequired(_options.ClientId, nameof(_options.ClientId));
      NormalizeRequired(_options.ClientSecret, nameof(_options.ClientSecret));

      if (_options.RequestTimeoutSeconds <= 0)
        throw new InvalidOperationException($"{YellowCardOptions.Section}:{nameof(_options.RequestTimeoutSeconds)} must be greater than zero");
    }

    private static void ValidateStatus(string status)
    {
      _ = YellowCardStatusHelper.ToPayoutStatus(status);
    }

    private static void ValidateSessionStatus(string status)
    {
      if (YellowCardStatusHelper.ToPayoutStatus(status) != PayoutTransactionStatus.Processing)
        throw new InvalidOperationException($"IXO hosted payout session cannot be returned for status '{status}'");
    }

    private static string NormalizeRequired(string? value, string parameterName)
    {
      value = value?.Trim();
      return string.IsNullOrEmpty(value) ? throw new ArgumentNullException(parameterName) : value;
    }

    private static string NormalizePaymentUrl(string? paymentUrl)
    {
      paymentUrl = NormalizeRequired(paymentUrl, nameof(paymentUrl));
      if (!Uri.TryCreate(paymentUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
        throw new InvalidOperationException("IXO hosted payout response must contain a valid HTTPS payment URL");

      return paymentUrl;
    }

    private static void ValidateHttpsUrl(string? value, string propertyName)
    {
      value = NormalizeRequired(value, propertyName);
      if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
        throw new InvalidOperationException($"{YellowCardOptions.Section}:{propertyName} must be a valid HTTPS URL");
    }

    private static DateTimeOffset ParseDateTimeOffset(string? value, string propertyName)
    {
      if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var result))
        throw new InvalidOperationException($"IXO hosted payout response contains an invalid '{propertyName}' value");

      return result;
    }
    #endregion
  }
}

using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Globalization;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
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
    private readonly AppSettings _appSettings;
    private readonly YellowCardOptions _options;
    private readonly IYellowCardAuthService _authService;
    private readonly IMemoryCache _memoryCache;
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public YellowCardClient(
      ILogger<YellowCardClient> logger,
      AppSettings appSettings,
      YellowCardOptions options,
      IYellowCardAuthService authService,
      IMemoryCache memoryCache,
      ICountryService countryService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings ?? throw new ArgumentNullException(nameof(appSettings));
      _options = options ?? throw new ArgumentNullException(nameof(options));
      _authService = authService ?? throw new ArgumentNullException(nameof(authService));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
    }
    #endregion

    #region Public Members
    /// <inheritdoc />
    public async Task<PayoutCountries> ListCountriesSupported()
    {
      try
      {
        if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
          return new PayoutCountries { Countries = await ListCountriesSupportedInternal() };

        var result = await _memoryCache.GetOrCreateAsync(CacheHelper.GenerateKey<YellowCardClient>("supported-countries"), async entry =>
        {
          entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
          entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
          return await ListCountriesSupportedInternal();
        }) ?? throw new InvalidOperationException("Failed to retrieve cached payout-country availability");

        return new PayoutCountries { Countries = result };
      }
      catch (HttpClientException)
      {
        // Country availability is live provider guidance. An expected provider outage must not break
        // the complete user profile; payout initiation remains fail-closed in the domain.
        return new PayoutCountries { Offline = true };
      }
    }

    public async Task<PayoutResponse> Initiate(PayoutRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
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
    private async Task<List<Domain.Lookups.Models.Country>> ListCountriesSupportedInternal()
    {
      var response = await Execute<YellowCardCountriesResponse>(() =>
        _options.SupportedCountriesUrl
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
          .GetAsync());

      if (!response.Success)
        throw new InvalidOperationException("IXO payout-country response was unsuccessful");

      if (response.Countries == null)
        throw new InvalidOperationException("IXO payout-country response does not contain a country list");

      var countryCodesAlpha2 = response.Countries
        .Select(o => o?.Trim().ToUpperInvariant())
        .Where(o => !string.IsNullOrEmpty(o))
        .Select(o => o!)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

      if (countryCodesAlpha2.Count == 0)
        throw new InvalidOperationException("IXO payout-country response contains no countries");
      if (countryCodesAlpha2.Any(o => o.Length != 2 || !o.All(char.IsAsciiLetter)))
        throw new InvalidOperationException("IXO payout-country response contains an invalid ISO 3166-1 alpha-2 country code");
      if (response.Count != countryCodesAlpha2.Count)
        throw new InvalidOperationException("IXO payout-country response count does not match its country list");

      var countries = _countryService.List(true);
      var unresolvedCodes = countryCodesAlpha2
        .Where(code => !countries.Any(country => string.Equals(country.CodeAlpha2, code, StringComparison.OrdinalIgnoreCase)))
        .ToList();

      if (unresolvedCodes.Count != 0)
        throw new DataInconsistencyException($"IXO returned countries not configured in Yoma: {string.Join(", ", unresolvedCodes)}");

      return [.. countries
        .Where(country => countryCodesAlpha2.Contains(country.CodeAlpha2, StringComparer.OrdinalIgnoreCase))
        .OrderBy(country => country.Name)];
    }

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

    private static DateTimeOffset ParseDateTimeOffset(string? value, string propertyName)
    {
      if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var result))
        throw new InvalidOperationException($"IXO hosted payout response contains an invalid '{propertyName}' value");

      return result;
    }
    #endregion
  }
}

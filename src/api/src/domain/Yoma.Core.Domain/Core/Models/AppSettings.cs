namespace Yoma.Core.Domain.Core.Models
{
  public class AppSettings
  {
    #region Class Variables
    public const string Section = nameof(AppSettings);
    #endregion

    #region Public Members
    public string AppBaseURL { get; set; }

    public AppSettingsCredentials Hangfire { get; set; }

    public string YomaWebClientId { get; set; }

    public string AuthorizationPolicyAudience { get; set; }

    public string AuthorizationPolicyScope { get; set; }

    public string SwaggerScopesAuthorizationCode { get; set; }

    public string SwaggerScopesClientCredentials { get; set; }

    public int CacheSlidingExpirationInHours { get; set; }

    public int CacheAbsoluteExpirationRelativeToNowInDays { get; set; }

    public int CacheAbsoluteExpirationRelativeToNowInHoursAnalytics { get; set; }

    public string CacheEnabledByCacheItemTypes { get; set; }

    public CacheItemType CacheEnabledByCacheItemTypesAsEnum
    {
      get
      {
        var result = CacheItemType.None;
        if (string.IsNullOrWhiteSpace(CacheEnabledByCacheItemTypes)) return result;
        CacheEnabledByCacheItemTypes = CacheEnabledByCacheItemTypes.Trim();

        var types = CacheEnabledByCacheItemTypes?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        if (types == null || types.Length == 0) return result;
        foreach (var type in types)
        {
          if (!Enum.TryParse<CacheItemType>(type, true, out var parsedValue))
            throw new ArgumentException($"Cache enabled by cache item type of '{type}' not supported", nameof(type));
          result |= (CacheItemType)parsedValue;
        }

        return result;
      }
    }

    public string YomaOrganizationName { get; set; }

    public string YomaSupportEmailAddress { get; set; }

    /// <summary>
    /// -1: Represents infinite retries. Never transitions to an error state.
    /// 0: Represents no retries. Immediately transitions to an error state.
    /// >0: Represents the maximum number of retries. Transitions to an error state when retries exceed the specified value.
    public int SSIMaximumRetryAttempts { get; set; }

    public string SSISchemaFullNameYoID { get; set; }

    /// <summary>
    /// -1: Represents infinite retries. Never transitions to an error state.
    /// 0: Represents no retries. Immediately transitions to an error state.
    /// >0: Represents the maximum number of retries. Transitions to an error state when retries exceed the specified value.
    public int RewardMaximumRetryAttempts { get; set; }

    public string TestDataSeedingEnvironments { get; set; }

    public Environment TestDataSeedingEnvironmentsAsEnum => ParseEnvironmentInput(TestDataSeedingEnvironments);

    public int TestDataSeedingDelayInMinutes { get; set; }

    public string SendGridEnabledEnvironments { get; set; }

    public Environment SendGridEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SendGridEnabledEnvironments);

    public string SentryEnabledEnvironments { get; set; }

    public Environment SentryEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SentryEnabledEnvironments);

    public string TwilioEnabledEnvironments { get; set; }

    public Environment TwilioEnabledEnvironmentsAsEnum => ParseEnvironmentInput(TwilioEnabledEnvironments);

    public string HttpsRedirectionEnabledEnvironments { get; set; }

    public Environment HttpsRedirectionEnabledEnvironmentsAsEnum => ParseEnvironmentInput(HttpsRedirectionEnabledEnvironments);

    public string LaborMarketProviderAsSourceEnabledEnvironments { get; set; }

    public Environment LaborMarketProviderAsSourceEnabledEnvironmentsAsEnum => ParseEnvironmentInput(LaborMarketProviderAsSourceEnabledEnvironments);

    public string ShortLinkProviderAsSourceEnabledEnvironments { get; set; }

    public Environment ShortLinkProviderAsSourceEnabledEnvironmentsAsEnum => ParseEnvironmentInput(ShortLinkProviderAsSourceEnabledEnvironments);

    public string PartnerSharingEnabledEnvironments { get; set; }

    public Environment PartnerSharingEnabledEnvironmentsAsEnum => ParseEnvironmentInput(PartnerSharingEnabledEnvironments);

    public string SSIEnabledEnvironments { get; set; }

    public Environment SSIEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SSIEnabledEnvironments);

    /// <summary>
    /// -1: Represents infinite retries. Never transitions to an error state.
    /// 0: Represents no retries. Immediately transitions to an error state.
    /// >0: Represents the maximum number of retries. Transitions to an error state when retries exceed the specified value.
    public int PartnerSharingMaximumRetryAttempts { get; set; }

    /// <summary>
    /// Determines the expiration behavior for item reservations
    /// -1: Never expires
    /// 0: Expires immediately
    /// >0: Specifies the expiration time in minutes
    /// </summary>
    public int MarketplaceItemReservationExpirationInMinutes { get; set; }

    public AppSettingsDatabaseRetryPolicy DatabaseRetryPolicy { get; set; }

    public bool? RedisSSLCertificateValidationBypass { get; set; }

    /// <summary>
    /// -1: Represents infinite retries. Never transitions to an error state.
    /// 0: Represents no retries. Immediately transitions to an error state.
    /// >0: Represents the maximum number of retries. Transitions to an error state when retries exceed the specified value.
    public int DownloadScheduleMaximumRetryAttempts { get; set; }

    /// <summary>
    /// Defines the time, in hours, before a scheduled download link expires and becomes inaccessible.
    /// </summary>
    public int DownloadScheduleLinkExpirationHours { get; set; }

    /// <summary>
    /// The maximum number of verification files to include in a single scheduled download batch. 
    /// Used when splitting large download requests into multiple scheduled pages.
    /// </summary>
    public int DownloadScheduleVerificationFilesBatchSize { get; set; }
    #endregion

    #region Private Members
    private static Environment ParseEnvironmentInput(string input)
    {
      var result = Environment.None;

      if (string.IsNullOrWhiteSpace(input)) return result;
      input = input.Trim();

      var environments = input?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

      if (environments == null || environments.Length == 0) return result;
      foreach (var environment in environments)
      {
        if (!Enum.TryParse<Environment>(environment, true, out var parsedValue))
          throw new ArgumentException($"Test data seeding environment of '{environment}' not supported", nameof(input));
        result |= parsedValue;
      }

      return result;
    }
    #endregion
  }
}

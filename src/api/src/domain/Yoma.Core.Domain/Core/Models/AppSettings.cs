namespace Yoma.Core.Domain.Core.Models
{
  public class AppSettings
  {
    #region Class Variables
    public const string Section = nameof(AppSettings);
    #endregion

    #region Public Members
    public string AppBaseURL { get; set; } = null!;

    public AppSettingsCredentials Hangfire { get; set; } = null!;

    public string YomaWebClientId { get; set; } = null!;

    public string AuthorizationPolicyAudience { get; set; } = null!;

    public string AuthorizationPolicyScope { get; set; } = null!;

    public string SwaggerScopesAuthorizationCode { get; set; } = null!;

    public string SwaggerScopesClientCredentials { get; set; } = null!;

    public int CacheSlidingExpirationInHours { get; set; }

    public int CacheAbsoluteExpirationRelativeToNowInDays { get; set; }

    public int CacheAbsoluteExpirationRelativeToNowInHoursAnalytics { get; set; }

    public string CacheEnabledByCacheItemTypes { get; set; } = null!;

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

    public string YomaOrganizationName { get; set; } = null!;

    public string YomaSupportEmailAddress { get; set; } = null!;

    /// <summary>
    /// -1: Represents infinite retries. Never transitions to an error state.
    /// 0: Represents no retries. Immediately transitions to an error state.
    /// >0: Represents the maximum number of retries. Transitions to an error state when retries exceed the specified value.
    public int SSIMaximumRetryAttempts { get; set; }

    public string SSISchemaFullNameYoID { get; set; } = null!;

    /// <summary>
    /// -1: Represents infinite retries. Never transitions to an error state.
    /// 0: Represents no retries. Immediately transitions to an error state.
    /// >0: Represents the maximum number of retries. Transitions to an error state when retries exceed the specified value.
    public int RewardMaximumRetryAttempts { get; set; }

    public string TestDataSeedingEnvironments { get; set; } = null!;

    public Environment TestDataSeedingEnvironmentsAsEnum => ParseEnvironmentInput(TestDataSeedingEnvironments);

    public int TestDataSeedingDelayInMinutes { get; set; }

    public string SendGridEnabledEnvironments { get; set; } = null!;

    public Environment SendGridEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SendGridEnabledEnvironments);

    public string SentryEnabledEnvironments { get; set; } = null!;

    public Environment SentryEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SentryEnabledEnvironments);

    public string TwilioEnabledEnvironments { get; set; } = null!;

    public Environment TwilioEnabledEnvironmentsAsEnum => ParseEnvironmentInput(TwilioEnabledEnvironments);

    public string HttpsRedirectionEnabledEnvironments { get; set; } = null!;

    public Environment HttpsRedirectionEnabledEnvironmentsAsEnum => ParseEnvironmentInput(HttpsRedirectionEnabledEnvironments);

    public string LaborMarketProviderAsSourceEnabledEnvironments { get; set; } = null!;

    public Environment LaborMarketProviderAsSourceEnabledEnvironmentsAsEnum => ParseEnvironmentInput(LaborMarketProviderAsSourceEnabledEnvironments);

    public string ShortLinkProviderAsSourceEnabledEnvironments { get; set; } = null!;

    public Environment ShortLinkProviderAsSourceEnabledEnvironmentsAsEnum => ParseEnvironmentInput(ShortLinkProviderAsSourceEnabledEnvironments);

    public string PartnerSharingEnabledEnvironments { get; set; } = null!;

    public Environment PartnerSharingEnabledEnvironmentsAsEnum => ParseEnvironmentInput(PartnerSharingEnabledEnvironments);

    public string SSIEnabledEnvironments { get; set; } = null!;

    public Environment SSIEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SSIEnabledEnvironments);

    public string NewsFeedProviderAsSourceEnabledEnvironments { get; set; } = null!;

    public Environment NewsFeedProviderAsSourceEnabledEnvironmentsAsEnum => ParseEnvironmentInput(NewsFeedProviderAsSourceEnabledEnvironments);

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

    public AppSettingsDatabaseRetryPolicy DatabaseRetryPolicy { get; set; } = null!;

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

    public AppSettingsSSIParallelism SSIParallelism { get; set; } = null!;

    public int CSVImportMaxProbeErrorCount { get; set; }

    public int IdempotencyKeyExpirationInSeconds { get; set; }

    public int DistributedLockRetryDelayInMilliseconds { get; set; }

    public int DistributedLockKeycloakEventDurationInSeconds { get; set; }

    public int DistributedLockReferralProgressDurationInSeconds { get; set; }

    public bool ReferralRestrictRefereeToSingleProgram { get; set; }

    public int ReferralFirstClaimSinceYoIDOnboardedTimeoutInHours { get; set; }
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

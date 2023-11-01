namespace Yoma.Core.Domain.Core.Models
{
    public class AppSettings
    {
        public const string Section = nameof(AppSettings);

        public string AppBaseURL { get; set; }

        public AppSettingsCredentials Hangfire { get; set; }

        public string AuthorizationPolicyScope { get; set; }

        public string SwaggerScopes { get; set; }

        public int CacheSlidingExpirationInHours { get; set; }

        public int CacheAbsoluteExpirationRelativeToNowInDays { get; set; }

        public CacheItemType CacheEnabledByCacheItemTypes { get; set; }

        public int SSIMaximumRetryAttempts { get; set; }
    }

    public class AppSettingsCredentials
    {
        public string Username { get; set; }

        public string Password { get; set; }
    }
}

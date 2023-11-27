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

        public string AuthorizationPolicyScope { get; set; }

        public string SwaggerScopes { get; set; }

        public int CacheSlidingExpirationInHours { get; set; }

        public int CacheAbsoluteExpirationRelativeToNowInDays { get; set; }

        public string CacheEnabledByCacheItemTypes { get; set; }

        public CacheItemType CacheEnabledByCacheItemTypesAsEnum
        {
            get
            {
                var result = CacheItemType.None;
                if (string.IsNullOrWhiteSpace(CacheEnabledByCacheItemTypes)) return result;
                CacheEnabledByCacheItemTypes = CacheEnabledByCacheItemTypes.Trim();

                var types = CacheEnabledByCacheItemTypes?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

                if (types == null || !types.Any()) return result;
                foreach (var type in types)
                {
                    if (!Enum.TryParse<CacheItemType>(type, true, out var parsedValue))
                        throw new ArgumentException($"Cache enabled by cache item type of '{type}' not supported", nameof(type));
                    result |= (CacheItemType)parsedValue;
                }

                return result;
            }
        }

        public int SSIMaximumRetryAttempts { get; set; }

        public string SSIIssuerNameYomaOrganization { get; set; }

        public string SSISchemaFullNameYoID { get; set; }

        public string TestDataSeedingEnvironments { get; set; }

        public Environment TestDataSeedingEnvironmentsAsEnum => ParseEnvironmentInput(TestDataSeedingEnvironments);

        public int TestDataSeedingDelayInMinutes { get; set; }

        public string SendGridEnabledEnvironments { get; set; }

        public Environment SendGridEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SendGridEnabledEnvironments);

        public string SentryEnabledEnvironments { get; set; }

        public Environment SentryEnabledEnvironmentsAsEnum => ParseEnvironmentInput(SentryEnabledEnvironments);

        public string HttpsRedirectionEnabledEnvironments { get; set; }

        public Environment HttpsRedirectionEnabledEnvironmentsAsEnum => ParseEnvironmentInput(HttpsRedirectionEnabledEnvironments);

        public string LaborMarketProviderAsSourceEnabledEnvironments { get; set; }

        public Environment LaborMarketProviderAsSourceEnabledEnvironmentsAsEnum => ParseEnvironmentInput(LaborMarketProviderAsSourceEnabledEnvironments);
        #endregion

        #region Private Members
        private Environment ParseEnvironmentInput(string input)
        {
            var result = Environment.None;

            if (string.IsNullOrWhiteSpace(input)) return result;
            input = input.Trim();

            var environments = input?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

            if (environments == null || !environments.Any()) return result;
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

namespace Yoma.Core.Domain.Core.Models
{
    public class AppSettingsDatabaseRetryPolicy
    {
        public int MaxRetryCount { get; set; }

        public int MaxRetryDelayInSeconds { get; set; }
    }
}

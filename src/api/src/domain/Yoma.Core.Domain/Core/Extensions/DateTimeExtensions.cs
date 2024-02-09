namespace Yoma.Core.Domain.Core.Extensions
{
    public static class DateTimeExtensions
    {
        public static DateTimeOffset RemoveTime(this DateTimeOffset e)
        {
            return new DateTimeOffset(new DateTime(e.Year, e.Month, e.Day, 0, 0, 0, DateTimeKind.Utc), TimeSpan.Zero);
        }

        public static DateTimeOffset? RemoveTime(this DateTimeOffset? e)            
        {
            if (!e.HasValue) return null;
            return new DateTimeOffset(new DateTime(e.Value.Year, e.Value.Month, e.Value.Day, 0, 0, 0, DateTimeKind.Utc), TimeSpan.Zero);
        }

        public static DateTimeOffset ToEndOfDay(this DateTimeOffset e)
        {
            return new DateTimeOffset(new DateTime(e.Year, e.Month, e.Day, 23, 59, 59, 999, DateTimeKind.Utc), TimeSpan.Zero);
        }

        public static DateTimeOffset? ToEndOfDay(this DateTimeOffset? e)
        {
            if (!e.HasValue) return null;
            return new DateTimeOffset(new DateTime(e.Value.Year, e.Value.Month, e.Value.Day, 23, 59, 59, 999, DateTimeKind.Utc), TimeSpan.Zero);
        }
    }
}

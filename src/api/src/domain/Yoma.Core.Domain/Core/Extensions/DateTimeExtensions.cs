namespace Yoma.Core.Domain.Core.Extensions
{
    public static class DateTimeExtensions
    {
        public static DateTime RemoveTime(this DateTime e)
        {
            return new DateTime(e.Year, e.Month, e.Day);
        }

        public static DateTime? RemoveTime(this DateTime? e)
        {
            if (!e.HasValue) return null;
            return new DateTime(e.Value.Year, e.Value.Month, e.Value.Day);
        }

        public static DateTimeOffset RemoveTime(this DateTimeOffset e, TimeSpan? offSet = null)
        {
            return new DateTimeOffset(new DateTime(e.Year, e.Month, e.Day), offSet ?? e.Offset);
        }

        public static DateTimeOffset? RemoveTime(this DateTimeOffset? e, TimeSpan? offSet = null)
        {
            if (!e.HasValue) return null;
            return new DateTimeOffset(new DateTime(e.Value.Year, e.Value.Month, e.Value.Day), offSet ?? e.Value.Offset);
        }

        public static DateTime ToEndOfDay(this DateTime e)
        {
            return new DateTime(e.Year, e.Month, e.Day, 23, 59, 59, 999);
        }

        public static DateTime? ToEndOfDay(this DateTime? e)
        {
            if (!e.HasValue) return null;
            return new DateTime(e.Value.Year, e.Value.Month, e.Value.Day, 23, 59, 59, 999);
        }

        public static DateTimeOffset ToEndOfDay(this DateTimeOffset e, TimeSpan? offSet = null)
        {
            return new DateTimeOffset(new DateTime(e.Year, e.Month, e.Day, 23, 59, 59, 999, DateTimeKind.Unspecified), offSet ?? e.Offset);
        }

        public static DateTimeOffset? ToEndOfDay(this DateTimeOffset? e, TimeSpan? offSet = null)
        {
            if (!e.HasValue) return null;
            return new DateTimeOffset(new DateTime(e.Value.Year, e.Value.Month, e.Value.Day, 23, 59, 59, 999, DateTimeKind.Unspecified), offSet ?? e.Value.Offset);
        }

        /// <summary>
        /// Return normalized DateTime. If not valid returns DateTime.MinValue.
        /// </summary>
        /// <returns></returns>
        public static DateTime NormalizeNullableValue(this DateTime e)
        {
            if (e == DateTime.MinValue) return DateTime.MinValue;
            // ReSharper disable once ConvertIfStatementToReturnStatement
            if (e == DateTime.MaxValue) return DateTime.MinValue;
            return e;
        }

        /// <summary>
        /// Return normalized DateTime. If not valid returns null.
        /// </summary>
        /// <returns></returns>
        public static DateTime? NormalizeNullableValue(this DateTime? e)
        {
            if (!e.HasValue) return null;
            if (e.Value == DateTime.MinValue) return null;
            if (e.Value == DateTime.MaxValue) return null;
            return e.Value;
        }
    }
}

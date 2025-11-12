using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data;
using System.Data.Common;
using System.Text.RegularExpressions;

namespace Yoma.Core.Infrastructure.Shared.Interceptors
{
  public sealed class ForUpdateInterceptor : DbCommandInterceptor
  {
    #region Regex Patterns
    // Lightweight regex with sane timeouts
    private static readonly Regex HasForUpdate = new(
        pattern: @"(?is)\bFOR\s+UPDATE\b",
        options: RegexOptions.Compiled,
        matchTimeout: TimeSpan.FromMilliseconds(50));

    private static readonly Regex AnyEfHint = new(
        pattern: @"EF_HINT:[A-Z0-9_]+",
        options: RegexOptions.IgnoreCase | RegexOptions.Compiled,
        matchTimeout: TimeSpan.FromMilliseconds(50));
    #endregion

    #region Overrides
    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
    {
      TryAppendForUpdate(command);
      return base.ReaderExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
      TryAppendForUpdate(command);
      return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result)
    {
      TryAppendForUpdate(command);
      return base.ScalarExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result,
        CancellationToken cancellationToken = default)
    {
      TryAppendForUpdate(command);
      return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }
    #endregion

    #region Private Members
    private static void TryAppendForUpdate(DbCommand cmd)
    {
      if (cmd.CommandType != CommandType.Text) return;

      var sql = cmd.CommandText;
      if (string.IsNullOrWhiteSpace(sql)) return;

      // Fast path: only proceed if we see an EF hint marker at all.
      if (sql.IndexOf("EF_HINT:", StringComparison.OrdinalIgnoreCase) < 0) return;

      // Only consider SELECT / CTE; cheap prefix check avoids heavy parsing.
      var start = sql.AsSpan().TrimStart();
      if (!StartsWithIgnoreCase(start, "select") && !StartsWithIgnoreCase(start, "with")) return;

      // Respect existing FOR UPDATE (don’t duplicate/override).
      if (HasForUpdate.IsMatch(sql)) return;

      // Extract supported hints from single source of truth
      var waitHint = HintConfig.LockHints[Domain.Core.LockMode.Wait];           // EF_HINT:FOR_UPDATE_WAIT
      var skipHint = HintConfig.LockHints[Domain.Core.LockMode.SkipLocked];     // EF_HINT:FOR_UPDATE_SKIP_LOCKED

      // Ensure we truly have a tag (TagWith emits as a SQL comment)
      if (!AnyEfHint.IsMatch(sql)) return;

      // Decide suffix; if neither of our hints is present, leave SQL untouched.
      string? suffix;
      if (Contains(sql, skipHint)) suffix = " FOR UPDATE SKIP LOCKED";
      else if (Contains(sql, waitHint)) suffix = " FOR UPDATE";
      else return;

      // Append suffix before a trailing ';' if present.
      var trimmed = sql.AsSpan().TrimEnd();
      var hasSemi = trimmed.Length > 0 && trimmed[^1] == ';';
      var body = hasSemi ? trimmed[..^1].ToString() : trimmed.ToString();

      cmd.CommandText = body + suffix + (hasSemi ? ";" : "");
    }

    private static bool StartsWithIgnoreCase(ReadOnlySpan<char> span, string value) =>
        span.Length >= value.Length && span[..value.Length].Equals(value, StringComparison.OrdinalIgnoreCase);

    private static bool Contains(string haystack, string needle) =>
        haystack.Contains(needle, StringComparison.OrdinalIgnoreCase);
    #endregion
  }
}

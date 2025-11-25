using System.Data;
using System.Data.Common;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Yoma.Core.Domain.Core;

/**************************************************************************************************
* ⚠️⚠️⚠️ WARNING — READ THIS BEFORE TOUCHING ANYTHING ⚠️⚠️⚠️
*
* This interceptor dynamically applies:
*
*     FOR UPDATE OF <alias>
*     FOR UPDATE OF <alias> SKIP LOCKED
*
* ...based on EF TagWith hints (HintConfig), using regex-based SQL mutation.
*
* It is safe, tested, and intentionally **fails soft**:
*   - If alias cannot be resolved → NO SQL MODIFICATION (query still executes normally)
*   - If query is a split-child (FROM (...)) → SKIPPED ON PURPOSE
*   - If lock already exists → LEFT UNCHANGED
*
* ⛔ HOWEVER — THIS CODE DEPENDS ON EF CORE’S SQL GENERATION PATTERNS.
*
* Before upgrading EF Core or Npgsql:
*
*   1. Capture SQL for tagged `.WithLock()` queries
*   2. Confirm that the root SELECT still begins with:
*
*        FROM "<schema>"."<table>" AS <alias>
*
*   3. Confirm split queries still generate `FROM (` for child selects
*   4. Confirm alias names remain valid SQL identifiers
*   5. Confirm TagWith still produces SQL comments containing Hint_Prefix
*
* If EF Core changes SQL structure (e.g. EF Core 10+), regex may MISS alias detection
* or accidentally suppress locking. It will NOT crash, but it MAY silently stop applying locks.
*
* ✔️ This is by design — fail-safe > production outage.
*
* If locking stops working after an upgrade:
*   - Start by inspecting the SQL in logs
*   - Check alias + FROM detection
*   - Adjust ONLY `RootAliasRegex` and `TryGetRootAlias` as necessary
*
* DO NOT REMOVE THE ALIAS SAFETY CHECK OR SUBQUERY GUARDS.
* Doing so will lead to Postgres exceptions:
*
*     0A000: FOR UPDATE cannot be applied to the nullable side of an outer join
*
***************************************************************************************************/
namespace Yoma.Core.Infrastructure.Shared.Interceptors
{
  /// <summary>
  /// Intercepts EF Core commands and, when explicitly tagged via WithLock/HintConfig,
  /// appends a PostgreSQL row-locking clause:
  ///   - FOR UPDATE OF <alias>
  ///   - FOR UPDATE OF <alias> SKIP LOCKED
  ///
  /// It is:
  ///   - Opt-in (only when the EF hint prefix is present),
  ///   - Safe (bails out if unsure, rather than breaking the SQL),
  ///   - Postgres-friendly for joins (always locks a specific root alias).
  /// </summary>
  public sealed partial class ForUpdateInterceptor : DbCommandInterceptor
  {
    #region Generated Regex

    // Guard: don't double-append FOR UPDATE
    [GeneratedRegex(@"\bFOR\s+UPDATE\b", RegexOptions.IgnoreCase | RegexOptions.Multiline)]
    private static partial Regex ForUpdateRegex();

    // Extract *root* table alias from the main FROM clause.
    // Handles e.g.:
    //   FROM "Referral"."Program" AS p
    //   FROM "Referral"."Program" p
    //   FROM "Program" AS p
    //   FROM "Program" p
    [GeneratedRegex(
      @"FROM\s+(?:""[^""]+""\s*\.\s*""[^""]+""|""[^""]+""|\w+(?:\.\w+)?)\s+(?:AS\s+)?(?<alias>[A-Za-z_][A-Za-z0-9_]*)",
      RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex RootAliasRegex();

    #endregion

    #region Overrides

    public override InterceptionResult<DbDataReader> ReaderExecuting(
      DbCommand command,
      CommandEventData eventData,
      InterceptionResult<DbDataReader> result)
    {
      ApplyForUpdate(command);
      return result;
    }

    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
      DbCommand command,
      CommandEventData eventData,
      InterceptionResult<DbDataReader> result,
      CancellationToken cancellationToken = default)
    {
      ApplyForUpdate(command);
      return ValueTask.FromResult(result);
    }

    #endregion

    #region Core Logic

    private static void ApplyForUpdate(DbCommand cmd)
    {
      if (cmd.CommandType != CommandType.Text)
        return;

      var sql = cmd.CommandText;
      if (string.IsNullOrWhiteSpace(sql))
        return;

      // Only touch queries explicitly tagged via WithLock (HintConfig)
      if (sql.IndexOf(HintConfig.Hint_Prefix, StringComparison.OrdinalIgnoreCase) < 0)
        return;

      // If FOR UPDATE already present, do nothing
      if (ForUpdateRegex().IsMatch(sql))
        return;

      // Resolve lock mode (WAIT vs SKIP_LOCKED)
      if (!TryResolveLockMode(sql, out var lockMode))
        return;

      // Try find a safe root alias from the main FROM
      var alias = TryGetRootAlias(sql);
      if (string.IsNullOrWhiteSpace(alias))
      {
        // SAFETY: if we can't confidently find an alias, DO NOT modify the SQL.
        // Query still runs, just without row-level locks.
        return;
      }

      var suffix = BuildSuffix(lockMode, alias);
      if (suffix is null)
        return;

      // Append suffix before trailing semicolon if present
      var span = sql.AsSpan().TrimEnd();
      var hasSemi = span.Length > 0 && span[^1] == ';';
      var body = hasSemi ? span[..^1].ToString() : span.ToString();

      cmd.CommandText = body + suffix + (hasSemi ? ";" : "");
    }

    private static string? TryGetRootAlias(string sql)
    {
      // Find the first FROM
      var fromIndex = sql.IndexOf("FROM", StringComparison.OrdinalIgnoreCase);
      if (fromIndex < 0) return null;

      // Look at what immediately follows "FROM"
      var afterFrom = sql.AsSpan(fromIndex + "FROM".Length).TrimStart();

      // If the outer FROM is a subquery (FROM (...)), we skip locking this query:
      // it’s almost certainly a split-child query; the root is already locked.
      if (!afterFrom.IsEmpty && afterFrom[0] == '(')
        return null;

      // Otherwise, pick up alias starting from this FROM (not from the start of the SQL)
      var match = RootAliasRegex().Match(sql, fromIndex);
      if (!match.Success) return null;

      var alias = match.Groups["alias"].Value;
      return string.IsNullOrWhiteSpace(alias) ? null : alias;
    }

    #endregion

    #region LockMode Resolution & Suffix

    private static bool TryResolveLockMode(string sql, out LockMode result)
    {
      result = default;
      LockMode? resolved = null;

      foreach (var (mode, hint) in HintConfig.LockHints)
      {
        if (sql.Contains(hint, StringComparison.OrdinalIgnoreCase))
        {
          resolved = resolved is null ? mode : ChooseStronger(resolved.Value, mode);
        }
      }

      if (resolved is null)
        return false;

      result = resolved.Value;
      return true;
    }

    private static LockMode ChooseStronger(LockMode current, LockMode candidate)
    {
      // If SKIP_LOCKED is present anywhere, it wins.
      if (candidate == LockMode.SkipLocked)
        return candidate;

      return current;
    }

    /// <summary>
    /// Always uses "FOR UPDATE OF alias" so Postgres is happy with joins.
    /// </summary>
    private static string? BuildSuffix(LockMode mode, string alias)
    {
      if (string.IsNullOrWhiteSpace(alias))
        return null;

      return mode switch
      {
        LockMode.Wait => $" FOR UPDATE OF {alias}",
        LockMode.SkipLocked => $" FOR UPDATE OF {alias} SKIP LOCKED",
        _ => null
      };
    }

    #endregion
  }
}

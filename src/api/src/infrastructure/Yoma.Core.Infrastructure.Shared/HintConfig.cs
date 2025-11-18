using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Shared
{
  public static class HintConfig
  {
    public const string Hint_Prefix = "EF_HINT:FOR_UPDATE_";

    /// <summary>
    /// Maps a Lock mode to the EF hint that triggers SQL translation.
    /// Extendable in future if more locking modes or hint types are added.
    /// </summary>
    public static readonly Dictionary<LockMode, string> LockHints = new()
    {
        { LockMode.Wait,       $"{Hint_Prefix}WAIT" },
        { LockMode.SkipLocked, $"{Hint_Prefix}LOCKED" }
    };
  }
}

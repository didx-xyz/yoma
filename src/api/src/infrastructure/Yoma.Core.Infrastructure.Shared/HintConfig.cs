using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Shared
{
  public static class HintConfig
  {
    /// <summary>
    /// Maps a Lock mode to the EF hint that triggers SQL translation.
    /// Extendable in future if more locking modes or hint types are added.
    /// </summary>
    public static readonly Dictionary<LockMode, string> LockHints = new()
    {
        { LockMode.Wait,       "EF_HINT:FOR_UPDATE_WAIT" },
        { LockMode.SkipLocked, "EF_HINT:FOR_UPDATE_SKIP_LOCKED" }
    };
  }
}

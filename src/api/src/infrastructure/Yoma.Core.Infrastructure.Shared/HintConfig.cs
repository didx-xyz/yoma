namespace Yoma.Core.Infrastructure.Shared
{
  public static class HintConfig
  {
    /// <summary>
    /// Maps a PessimisticLock mode to the EF hint that triggers SQL translation.
    /// Extendable in future if more locking modes or hint types are added.
    /// </summary>
    public static readonly Dictionary<PessimisticLock, string> PessimisticLockHints = new()
    {
        { PessimisticLock.Wait,       "EF_HINT:FOR_UPDATE_WAIT" },
        { PessimisticLock.SkipLocked, "EF_HINT:FOR_UPDATE_SKIP_LOCKED" }
    };
  }
}

namespace Yoma.Core.Infrastructure.Shared
{
  public enum PessimisticLock
  {
    // SELECT ... FOR UPDATE
    // When reading rows, PostgreSQL attempts to acquire a write-intent row lock.
    // If another transaction already holds a lock on a row,
    // the SELECT will WAIT at read-time until that row becomes unlocked.
    Wait,

    // SELECT ... FOR UPDATE SKIP LOCKED
    // When reading rows, PostgreSQL attempts to acquire a write-intent row lock.
    // If another transaction already holds a lock on a row,
    // the SELECT will NOT wait — the locked row is SKIPPED during read-time
    // and only currently-unlocked rows are returned.
    SkipLocked
  }
}

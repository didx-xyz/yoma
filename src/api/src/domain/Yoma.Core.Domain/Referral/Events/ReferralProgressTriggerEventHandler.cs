using MediatR;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Referral.Events
{
  public sealed class ReferralProgressTriggerEventHandler : INotificationHandler<ReferralProgressTriggerEvent>
  {
    #region Class Variables
    private readonly ILogger<ReferralProgressTriggerEventHandler> _logger;
    #endregion

    #region Constructor
    public ReferralProgressTriggerEventHandler(ILogger<ReferralProgressTriggerEventHandler> logger)
    {
      _logger = logger;
    }
    #endregion

    #region Public Members
    public async Task Handle(ReferralProgressTriggerEvent notification, CancellationToken cancellationToken)
    {
      await Task.CompletedTask;

      // 1. Distributed lock per UserId 
      // 2. Load fresh state from DB:
      //    - user POP / identity status
      //    - opporunity completion state
      // 3. State transition logic (upon completion):
      //    Program (global completion cap hit >> LimitReached >> ReferralLinkStatus.LimitReached
      //    Referral Link (per-referrer completion cap hit) >> LimitReached
      //    Referral Link Usage >> Completed
      // 4. Running Totals and Snapshots (uponc completion)
      //    Program: CompletionTotal, ZltoRewardCumulative
      //    Referral Link: CompletionTotal, ZltoRewardCumulative
      //    Referral Link Usages: ZltoRewardRefereeAwarded, ZltoRewardReferrerAwarded
      // 6. Schedule rewards transactions
      // 7. Commit scope


      /*
      # What the handler must do (checklist)

      1. **Distributed lock (per user)**

      * Key: `referral_progress:{UserId}`
      * Short TTL (e.g., 30–60s) + auto-extend while txn open.

      2. **Open a SERIALIZABLE transaction + execution strategy**

      * Use your `_executionStrategyService.ExecuteInExecutionStrategyAsync` + `TransactionScopeHelper.CreateSerializable(...)`.

      3. **Load fresh, locked state (ForUpdate(skipLocked: true))**

      * `User` identity/POP snapshot you need for task evaluation.
      * All **Pending** `ReferralLinkUsage` for this user that could be affected by the triggered event (often filter to the program(s)/task(s) implied by the event).
      * For each usage: `Program` (with `Pathway`→`Steps`→`Tasks`) and `Link`.
      * Lock the exact rows you will update: `Usage`, `Link` (for counters/status), `Program` (for counters/status).
      * Re-check predicates after locking (still Pending? still within window?).

      4. **Per usage, guardrails before evaluating completion**

      * **Program.Status** must allow completion: `Active` **or** `LimitReached`.

      * `Inactive`/`Expired`/`Deleted` ⇒ **expire usage**.
      * **Link.Status** must allow completion: `Active` **or** `LimitReached`.

      * `Cancelled`/`Expired` ⇒ **expire usage**.
      * **Completion window**: `now <= usage.DateClaimed + Program.CompletionWindowInDays` ⇒ else **expire usage**.
      * **Pathway satisfiable** *and* **referee meets task rules**:

      * Structural satisfiable: `program.Pathway.IsCompletable` (your computed property).
      * Evidence check: from event context (e.g., POP verified / specific Opportunity completed) recompute step→pathway rules:

      * Step.Rule `All` = all its tasks satisfied; `Any` = any one.
      * Pathway.Rule `All` = every step satisfied; `Any` = any step satisfied.
      * If not satisfied yet ⇒ leave **Pending** (no change).

      5. **If eligible → Complete the usage**

      * **Compute payout now** from current program config + pool:

      * Prioritize **referee**; referrer may be reduced/zero if pool insufficient.
      * Persist **only**: `RewardRefereeAwarded`, `RewardReferrerAwarded`, `DateCompleted`.
      * (No `RewardTotalAwarded` field; `ZltoRewardBalance` is derived, not stored.)
      * **Update counters/aggregates**:

      * `Usage.Status = Completed`
      * `Link.CompletionTotal++` and `Link.ZltoRewardCumulative += RewardReferrerAwarded`
      * `Program.CompletionTotal++` and `Program.ZltoRewardCumulative += (referee+referrer actually paid)`
      * **Enforce per-link cap** (`CompletionLimitReferee`):

      * If reached/exceeded ⇒ `Link.Status = LimitReached` (blocks new claims; existing Pending may still complete later).
      * **Enforce program-wide cap** (`CompletionLimit`):

      * If reached/exceeded ⇒ `Program.Status = LimitReached` (blocks new links/claims globally; existing Pending may still complete later).
      * Do **not** expire in-flight items.

      6. **Idempotency**

      * If a usage is already `Completed`/`Expired`, **no-op**.
      * Prefer a `RowVersion`/concurrency token or re-read state after lock + short-circuit.

      7. **Commit atomically**

      * All changes (usage status + payouts + counters + cap status flips) in the same SERIALIZABLE scope.

      8. **Fire notifications later (deferred)**

      * Queue via your `DelayedExecutionService` or domain event → notifier (we’ll wire after core path is green).

      ---

      # Code-shaped skeleton (C#)

      ```csharp
      public sealed class ReferralProgressTriggerEventHandler : INotificationHandler<ReferralProgressTriggerEvent>
      {
      private readonly IDistributedLockService _lock;
      private readonly IExecutionStrategyService _exec;
      private readonly IReferralRepositories _repo; // wrap user/program/link/usage reads
      private readonly IClock _clock;               // for testability
      private readonly IRewardCalculator _rewards;  // encapsulates pool & split rules
      private readonly ILogger<ReferralProgressTriggerEventHandler> _log;

      public async Task Handle(ReferralProgressTriggerEvent evt, CancellationToken ct)
      {
      var userId = evt.UserId;
      var lockId = $"referral_progress:{userId}";
      var lockAcquired = false;

      try
      {
      lockAcquired = await _lock.TryAcquireLockAsync(lockId, TimeSpan.FromSeconds(60));
      if (!lockAcquired) { _log.LogInformation("Skip progress; lock busy for user {UserId}", userId); return; }

      await _exec.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.Required);

        var now = _clock.UtcNow;

        // 1) Load fresh, locked state
        var user = await _repo.Users.GetForUpdateAsync(userId, ct);

        // Load only potentially affected usages (Pending for this user; optionally narrow by program/task from evt)
        var pendingUsages = await _repo.Usages.QueryPendingByUserForUpdateAsync(userId, filter: evt.Filter, skipLocked: true, ct);

        if (pendingUsages.Count == 0)
        {
          scope.Complete();
          return;
        }

        foreach (var usage in pendingUsages)
        {
          // Rehydrate relations (locked): Program (+Pathway/Steps/Tasks), Link
          var program = await _repo.Programs.GetForUpdateWithPathwayAsync(usage.ProgramId, ct);
          var link    = await _repo.Links.GetForUpdateAsync(usage.LinkId, ct);

          // Re-check still pending (idempotency)
          if (usage.Status != ReferralLinkUsageStatus.Pending)
            continue;

          // ---- Guards ----
          // Program status gate
          var programAllowsCompletion =
               program.Status == ProgramStatus.Active
            || program.Status == ProgramStatus.LimitReached;

          if (!programAllowsCompletion)
          {
            usage.Status = ReferralLinkUsageStatus.Expired;
            continue;
          }

          // Link status gate
          var linkAllowsCompletion =
               link.Status == ReferralLinkStatus.Active
            || link.Status == ReferralLinkStatus.LimitReached;

          if (!linkAllowsCompletion)
          {
            usage.Status = ReferralLinkUsageStatus.Expired;
            continue;
          }

          // Completion window
          if (!usage.ProgramCompletionWindowInDays.HasValue ||
              now > usage.DateClaimed.AddDays(usage.ProgramCompletionWindowInDays.Value))
          {
            usage.Status = ReferralLinkUsageStatus.Expired;
            continue;
          }

          // Pathway satisfiable + evidence meets rules
          var pathway = program.Pathway;
          var structureOk = pathway?.IsCompletable ?? true; // your computed property
          if (!structureOk)
          {
            // leave Pending (program health job will handle eventual expiry)
            continue;
          }

          var meetsTasks = await _repo.Evidence.MeetsPathwayRulesAsync(userId, pathway, evt, ct);
          if (!meetsTasks)
          {
            // nothing to do yet
            continue;
          }

          // ---- Complete usage ----
          var (toReferee, toReferrer) = await _rewards.ComputeAsync(program, link, usage, now, ct);

          usage.Status = ReferralLinkUsageStatus.Completed;
          usage.RewardRefereeAwarded = toReferee;
          usage.RewardReferrerAwarded = toReferrer;
          usage.DateCompleted = now;

          // Aggregates
          link.CompletionTotal += 1;
          link.ZltoRewardCumulative += toReferrer;

          program.CompletionTotal += 1;
          program.ZltoRewardCumulative += (toReferee + toReferrer);
          // program balance is derived elsewhere; do not persist a balance field

          // Per-link cap
          if (program.CompletionLimitReferee.HasValue &&
              link.CompletionTotal >= program.CompletionLimitReferee.Value)
          {
            link.Status = ReferralLinkStatus.LimitReached;
          }

          // Program-wide cap
          if (program.CompletionLimit.HasValue &&
              program.CompletionTotal >= program.CompletionLimit.Value)
          {
            // Terminal for growth; pending may still finish later
            program.Status = ProgramStatus.LimitReached;
          }

          // Defer notifications/payout side-effects via delayed executor/domain events (hook later)
          // _delayed.Enqueue(() => _notifier.NotifyUsageCompleted(...));
          // _delayed.Enqueue(() => _notifier.NotifyReferrerReward(...));
        }

        // 2) Persist all
        await _repo.SaveChangesAsync(ct);

        scope.Complete();
        });
        }
        catch (Exception ex)
        {
        _log.LogError(ex, "Referral progress failed for user {UserId}", userId);
        throw;
        }
        finally
        {
        if (lockAcquired) await _lock.ReleaseLockAsync(lockId);
        }
        }
        }
        ```

        # Notes & gotchas (all decided today)

        * **Statuses**:

        * Program: `Active`, `Inactive`, `UnCompletable`, `Expired`, `LimitReached`, `Deleted`.
        * Link: `Active`, `LimitReached`, `Cancelled`, `Expired`.
        * Usage: `Pending`, `Completed`, `Expired`.
        * **No `ExpireReason`, no `Program.IsCompletable` flag** persisted. We **compute** `Pathway.IsCompletable` from Steps/Tasks.
        * **No `RewardTotalAwarded` column**; store only `RewardRefereeAwarded` + `RewardReferrerAwarded`.
        * **Program balance** is **derived**, not stored (we keep `ZltoRewardPool` config and `ZltoRewardCumulative` actuals).
        * **Don’t punish in-flight**: `LimitReached` (link/program) still allows existing Pending to complete if their window & rules pass.
        * Background jobs now use **`ForUpdate(skipLocked: true)`** within **transaction scopes** for each batch; event handler uses **SERIALIZABLE**.
        * **Reads are inside the tx** (after acquiring the distributed lock) to avoid TOCTOU issues; we **re-check** all predicates after locking.

        If you want, I can tailor the repository method signatures you’ll need (`QueryPendingByUserForUpdateAsync`, `GetForUpdateWithPathwayAsync`, etc.) to match your existing pattern.
      */
    }
    #endregion
  }
}

using Yoma.Core.Domain.Referral.Models.Lookups;

namespace Yoma.Core.Test.Referral.Builders
{
  public static class LookupBuilder
  {
    #region Link Status
    public static readonly Guid LinkStatusActiveId = Guid.Parse("a0000000-0000-0000-0000-000000000001");
    public static readonly Guid LinkStatusCancelledId = Guid.Parse("a0000000-0000-0000-0000-000000000002");
    public static readonly Guid LinkStatusLimitReachedId = Guid.Parse("a0000000-0000-0000-0000-000000000003");
    public static readonly Guid LinkStatusExpiredId = Guid.Parse("a0000000-0000-0000-0000-000000000004");

    public static LinkStatus LinkStatusActive => new() { Id = LinkStatusActiveId, Name = "Active" };
    public static LinkStatus LinkStatusCancelled => new() { Id = LinkStatusCancelledId, Name = "Cancelled" };
    public static LinkStatus LinkStatusLimitReached => new() { Id = LinkStatusLimitReachedId, Name = "LimitReached" };
    public static LinkStatus LinkStatusExpired => new() { Id = LinkStatusExpiredId, Name = "Expired" };
    #endregion

    #region Link Usage Status
    public static readonly Guid UsageStatusInitiatedId = Guid.Parse("b0000000-0000-0000-0000-000000000004");
    public static readonly Guid UsageStatusPendingId = Guid.Parse("b0000000-0000-0000-0000-000000000001");
    public static readonly Guid UsageStatusCompletedId = Guid.Parse("b0000000-0000-0000-0000-000000000002");
    public static readonly Guid UsageStatusExpiredId = Guid.Parse("b0000000-0000-0000-0000-000000000003");
    public static readonly Guid UsageStatusAbandonedId = Guid.Parse("b0000000-0000-0000-0000-000000000005");

    public static LinkUsageStatus UsageStatusInitiated => new()
    {
      Id = UsageStatusInitiatedId,
      Name = Domain.Referral.ReferralLinkUsageStatus.Initiated.ToString()
    };

    public static LinkUsageStatus UsageStatusPending => new()
    {
      Id = UsageStatusPendingId,
      Name = Domain.Referral.ReferralLinkUsageStatus.Pending.ToString()
    };

    public static LinkUsageStatus UsageStatusCompleted => new()
    {
      Id = UsageStatusCompletedId,
      Name = Domain.Referral.ReferralLinkUsageStatus.Completed.ToString()
    };

    public static LinkUsageStatus UsageStatusExpired => new()
    {
      Id = UsageStatusExpiredId,
      Name = Domain.Referral.ReferralLinkUsageStatus.Expired.ToString()
    };

    public static LinkUsageStatus UsageStatusAbandoned => new()
    {
      Id = UsageStatusAbandonedId,
      Name = Domain.Referral.ReferralLinkUsageStatus.Abandoned.ToString()
    };
    #endregion

    #region Program Status
    public static readonly Guid ProgramStatusActiveId = Guid.Parse("c0000000-0000-0000-0000-000000000001");
    public static readonly Guid ProgramStatusInactiveId = Guid.Parse("c0000000-0000-0000-0000-000000000002");
    public static readonly Guid ProgramStatusExpiredId = Guid.Parse("c0000000-0000-0000-0000-000000000003");
    public static readonly Guid ProgramStatusLimitReachedId = Guid.Parse("c0000000-0000-0000-0000-000000000004");
    public static readonly Guid ProgramStatusUnCompletableId = Guid.Parse("c0000000-0000-0000-0000-000000000005");
    public static readonly Guid ProgramStatusDeletedId = Guid.Parse("c0000000-0000-0000-0000-000000000006");

    public static ProgramStatus ProgramStatusActive => new() { Id = ProgramStatusActiveId, Name = "Active" };
    public static ProgramStatus ProgramStatusInactive => new() { Id = ProgramStatusInactiveId, Name = "Inactive" };
    public static ProgramStatus ProgramStatusExpired => new() { Id = ProgramStatusExpiredId, Name = "Expired" };
    public static ProgramStatus ProgramStatusLimitReached => new() { Id = ProgramStatusLimitReachedId, Name = "LimitReached" };
    public static ProgramStatus ProgramStatusUnCompletable => new() { Id = ProgramStatusUnCompletableId, Name = "UnCompletable" };
    public static ProgramStatus ProgramStatusDeleted => new() { Id = ProgramStatusDeletedId, Name = "Deleted" };
    #endregion

    #region Block Reason
    public static readonly Guid BlockReasonOtherId = Guid.Parse("d0000000-0000-0000-0000-000000000001");

    public static BlockReason BlockReasonOther => new() { Id = BlockReasonOtherId, Name = "Other", Description = "Other reason" };
    #endregion
  }
}

using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Test.Referral.Builders
{
  public class ReferralLinkUsageBuilder
  {
    private Guid _id = Guid.NewGuid();
    private Guid _programId = Guid.NewGuid();
    private string _programName = "Test Referral Program";
    private readonly string? _programDescription = "A test referral program";
    private int? _programCompletionWindowInDays = 30;
    private DateTimeOffset? _programDateEnd;
    private Guid _linkId = Guid.NewGuid();
    private string _linkName = "My Referral Link";
    private Guid _userIdReferrer = Guid.NewGuid();
    private string _usernameReferrer = "referrer@example.com";
    private string _userDisplayNameReferrer = "Test Referrer";
    private string? _userEmailReferrer = "referrer@example.com";
    private bool? _userEmailConfirmedReferrer = true;
    private string? _userPhoneNumberReferrer = "+27831234567";
    private bool? _userPhoneNumberConfirmedReferrer = true;
    private Guid _userId = Guid.NewGuid();
    private string _username = "referee@example.com";
    private string _userDisplayName = "Test Referee";
    private readonly string? _userEmail = "referee@example.com";
    private readonly bool? _userEmailConfirmed = true;
    private readonly string? _userPhoneNumber = "+27839876543";
    private readonly bool? _userPhoneNumberConfirmed = true;
    private bool? _userYoIDOnboarded = true;
    private Guid _statusId = LookupBuilder.UsageStatusPendingId;
    private Domain.Referral.ReferralLinkUsageStatus _status = Domain.Referral.ReferralLinkUsageStatus.Pending;
    private decimal? _zltoRewardReferee;
    private decimal? _zltoRewardReferrer;
    private DateTimeOffset _dateClaimed = DateTimeOffset.UtcNow;
    private DateTimeOffset _dateCreated = DateTimeOffset.UtcNow;
    private readonly DateTimeOffset _dateModified = DateTimeOffset.UtcNow;

    public ReferralLinkUsageBuilder WithId(Guid id) { _id = id; return this; }
    public ReferralLinkUsageBuilder WithProgramId(Guid programId) { _programId = programId; return this; }
    public ReferralLinkUsageBuilder WithProgramName(string name) { _programName = name; return this; }
    public ReferralLinkUsageBuilder WithProgramCompletionWindowInDays(int? days) { _programCompletionWindowInDays = days; return this; }
    public ReferralLinkUsageBuilder WithProgramDateEnd(DateTimeOffset? dateEnd) { _programDateEnd = dateEnd; return this; }
    public ReferralLinkUsageBuilder WithLinkId(Guid linkId) { _linkId = linkId; return this; }
    public ReferralLinkUsageBuilder WithLinkName(string name) { _linkName = name; return this; }
    public ReferralLinkUsageBuilder WithUserIdReferrer(Guid userId) { _userIdReferrer = userId; return this; }
    public ReferralLinkUsageBuilder WithUsernameReferrer(string username) { _usernameReferrer = username; return this; }
    public ReferralLinkUsageBuilder WithUserDisplayNameReferrer(string displayName) { _userDisplayNameReferrer = displayName; return this; }
    public ReferralLinkUsageBuilder WithUserId(Guid userId) { _userId = userId; return this; }
    public ReferralLinkUsageBuilder WithUsername(string username) { _username = username; return this; }
    public ReferralLinkUsageBuilder WithUserDisplayName(string displayName) { _userDisplayName = displayName; return this; }
    public ReferralLinkUsageBuilder WithUserYoIDOnboarded(bool? onboarded) { _userYoIDOnboarded = onboarded; return this; }

    public ReferralLinkUsageBuilder WithStatus(Domain.Referral.ReferralLinkUsageStatus status)
    {
      _status = status;
      _statusId = status switch
      {
        Domain.Referral.ReferralLinkUsageStatus.Pending => LookupBuilder.UsageStatusPendingId,
        Domain.Referral.ReferralLinkUsageStatus.Completed => LookupBuilder.UsageStatusCompletedId,
        Domain.Referral.ReferralLinkUsageStatus.Expired => LookupBuilder.UsageStatusExpiredId,
        _ => throw new ArgumentOutOfRangeException(nameof(status))
      };
      return this;
    }

    public ReferralLinkUsageBuilder WithZltoRewardReferee(decimal? amount) { _zltoRewardReferee = amount; return this; }
    public ReferralLinkUsageBuilder WithZltoRewardReferrer(decimal? amount) { _zltoRewardReferrer = amount; return this; }
    public ReferralLinkUsageBuilder WithDateClaimed(DateTimeOffset date) { _dateClaimed = date; _dateCreated = date; return this; }

    public ReferralLinkUsageBuilder FromLink(ReferralLink link)
    {
      _linkId = link.Id;
      _linkName = link.Name;
      _userIdReferrer = link.UserId;
      _usernameReferrer = link.Username;
      _userDisplayNameReferrer = link.UserDisplayName;
      _userEmailReferrer = link.UserEmail;
      _userEmailConfirmedReferrer = link.UserEmailConfirmed;
      _userPhoneNumberReferrer = link.UserPhoneNumber;
      _userPhoneNumberConfirmedReferrer = link.UserPhoneNumberConfirmed;
      _programId = link.ProgramId;
      _programName = link.ProgramName;
      return this;
    }

    public ReferralLinkUsage Build() => new()
    {
      Id = _id,
      ProgramId = _programId,
      ProgramName = _programName,
      ProgramDescription = _programDescription,
      ProgramCompletionWindowInDays = _programCompletionWindowInDays,
      ProgramDateEnd = _programDateEnd,
      LinkId = _linkId,
      LinkName = _linkName,
      UserIdReferrer = _userIdReferrer,
      UsernameReferrer = _usernameReferrer,
      UserDisplayNameReferrer = _userDisplayNameReferrer,
      UserEmailReferrer = _userEmailReferrer,
      UserEmailConfirmedReferrer = _userEmailConfirmedReferrer,
      UserPhoneNumberReferrer = _userPhoneNumberReferrer,
      UserPhoneNumberConfirmedReferrer = _userPhoneNumberConfirmedReferrer,
      UserId = _userId,
      Username = _username,
      UserDisplayName = _userDisplayName,
      UserEmail = _userEmail,
      UserEmailConfirmed = _userEmailConfirmed,
      UserPhoneNumber = _userPhoneNumber,
      UserPhoneNumberConfirmed = _userPhoneNumberConfirmed,
      UserYoIDOnboarded = _userYoIDOnboarded,
      StatusId = _statusId,
      Status = _status,
      ZltoRewardReferee = _zltoRewardReferee,
      ZltoRewardReferrer = _zltoRewardReferrer,
      DateClaimed = _dateClaimed,
      DateCreated = _dateCreated,
      DateModified = _dateModified
    };
  }
}

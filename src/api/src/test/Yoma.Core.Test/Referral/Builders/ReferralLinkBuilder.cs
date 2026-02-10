using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Test.Referral.Builders
{
  public class ReferralLinkBuilder
  {
    private Guid _id = Guid.NewGuid();
    private string _name = "My Referral Link";
    private string? _description = "Test referral link";
    private Guid _programId = Guid.NewGuid();
    private string _programName = "Test Referral Program";
    private string? _programDescription = "A test referral program";
    private int? _programCompletionLimitReferee;
    private Guid _userId = Guid.NewGuid();
    private string _userDisplayName = "Test Referrer";
    private string _username = "referrer@example.com";
    private string? _userEmail = "referrer@example.com";
    private bool? _userEmailConfirmed = true;
    private string? _userPhoneNumber = "+27831234567";
    private bool? _userPhoneNumberConfirmed = true;
    private bool _blocked;
    private DateTimeOffset? _blockedDate;
    private Guid _statusId = LookupBuilder.LinkStatusActiveId;
    private Domain.Referral.ReferralLinkStatus _status = Domain.Referral.ReferralLinkStatus.Active;
    private string _url = "https://app.test.com/referrals/claim/test";
    private string _shortURL = "https://short.link/abc";
    private string? _qrCodeBase64;
    private int? _completionTotal;
    private decimal? _zltoRewardCumulative;
    private decimal _zltoRewardReferrerTotal;
    private decimal _zltoRewardRefereeTotal;
    private DateTimeOffset _dateCreated = DateTimeOffset.UtcNow.AddDays(-1);
    private DateTimeOffset _dateModified = DateTimeOffset.UtcNow;

    public ReferralLinkBuilder WithId(Guid id) { _id = id; return this; }
    public ReferralLinkBuilder WithName(string name) { _name = name; return this; }
    public ReferralLinkBuilder WithDescription(string? description) { _description = description; return this; }
    public ReferralLinkBuilder WithProgramId(Guid programId) { _programId = programId; return this; }
    public ReferralLinkBuilder WithProgramName(string programName) { _programName = programName; return this; }
    public ReferralLinkBuilder WithProgramCompletionLimitReferee(int? limit) { _programCompletionLimitReferee = limit; return this; }
    public ReferralLinkBuilder WithUserId(Guid userId) { _userId = userId; return this; }
    public ReferralLinkBuilder WithUserDisplayName(string displayName) { _userDisplayName = displayName; return this; }
    public ReferralLinkBuilder WithUsername(string username) { _username = username; return this; }
    public ReferralLinkBuilder WithBlocked(bool blocked) { _blocked = blocked; _blockedDate = blocked ? DateTimeOffset.UtcNow : null; return this; }

    public ReferralLinkBuilder WithStatus(Domain.Referral.ReferralLinkStatus status)
    {
      _status = status;
      _statusId = status switch
      {
        Domain.Referral.ReferralLinkStatus.Active => LookupBuilder.LinkStatusActiveId,
        Domain.Referral.ReferralLinkStatus.Cancelled => LookupBuilder.LinkStatusCancelledId,
        Domain.Referral.ReferralLinkStatus.LimitReached => LookupBuilder.LinkStatusLimitReachedId,
        Domain.Referral.ReferralLinkStatus.Expired => LookupBuilder.LinkStatusExpiredId,
        _ => throw new ArgumentOutOfRangeException(nameof(status))
      };
      return this;
    }

    public ReferralLinkBuilder WithCompletionTotal(int? total) { _completionTotal = total; return this; }
    public ReferralLinkBuilder WithZltoRewardCumulative(decimal? amount) { _zltoRewardCumulative = amount; return this; }
    public ReferralLinkBuilder WithURL(string url) { _url = url; return this; }
    public ReferralLinkBuilder WithShortURL(string shortURL) { _shortURL = shortURL; return this; }
    public ReferralLinkBuilder WithQRCodeBase64(string? qrCode) { _qrCodeBase64 = qrCode; return this; }

    public ReferralLink Build() => new()
    {
      Id = _id,
      Name = _name,
      Description = _description,
      ProgramId = _programId,
      ProgramName = _programName,
      ProgramDescription = _programDescription,
      ProgramCompletionLimitReferee = _programCompletionLimitReferee,
      UserId = _userId,
      UserDisplayName = _userDisplayName,
      Username = _username,
      UserEmail = _userEmail,
      UserEmailConfirmed = _userEmailConfirmed,
      UserPhoneNumber = _userPhoneNumber,
      UserPhoneNumberConfirmed = _userPhoneNumberConfirmed,
      Blocked = _blocked,
      BlockedDate = _blockedDate,
      StatusId = _statusId,
      Status = _status,
      URL = _url,
      ShortURL = _shortURL,
      QRCodeBase64 = _qrCodeBase64,
      CompletionTotal = _completionTotal,
      ZltoRewardCumulative = _zltoRewardCumulative,
      ZltoRewardReferrerTotal = _zltoRewardReferrerTotal,
      ZltoRewardRefereeTotal = _zltoRewardRefereeTotal,
      DateCreated = _dateCreated,
      DateModified = _dateModified
    };
  }
}

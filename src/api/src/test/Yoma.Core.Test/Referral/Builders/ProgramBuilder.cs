using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Test.Referral.Builders
{
  public class ProgramBuilder
  {
    private Guid _id = Guid.NewGuid();
    private string _name = "Test Referral Program";
    private string? _description = "A test referral program";
    private int? _completionWindowInDays = 30;
    private int? _completionLimitReferee;
    private int? _completionLimit;
    private int? _completionTotal;
    private decimal? _zltoRewardReferrer;
    private decimal? _zltoRewardReferee;
    private decimal? _zltoRewardPool;
    private decimal? _zltoRewardCumulative;
    private bool _proofOfPersonhoodRequired;
    private bool _pathwayRequired;
    private bool _multipleLinksAllowed;
    private Guid _statusId = LookupBuilder.ProgramStatusActiveId;
    private Domain.Referral.ProgramStatus _status = Domain.Referral.ProgramStatus.Active;
    private bool _isDefault;
    private DateTimeOffset _dateStart = DateTimeOffset.UtcNow.AddDays(-1);
    private DateTimeOffset? _dateEnd;
    private readonly DateTimeOffset _dateCreated = DateTimeOffset.UtcNow.AddDays(-1);
    private readonly Guid _createdByUserId = Guid.NewGuid();
    private readonly DateTimeOffset _dateModified = DateTimeOffset.UtcNow;
    private readonly Guid _modifiedByUserId = Guid.NewGuid();
    private ProgramPathway? _pathway;
    private List<Country>? _countries;

    public ProgramBuilder WithId(Guid id) { _id = id; return this; }
    public ProgramBuilder WithName(string name) { _name = name; return this; }
    public ProgramBuilder WithDescription(string? description) { _description = description; return this; }
    public ProgramBuilder WithCompletionWindowInDays(int? days) { _completionWindowInDays = days; return this; }
    public ProgramBuilder WithCompletionLimitReferee(int? limit) { _completionLimitReferee = limit; return this; }
    public ProgramBuilder WithCompletionLimit(int? limit) { _completionLimit = limit; return this; }
    public ProgramBuilder WithCompletionTotal(int? total) { _completionTotal = total; return this; }
    public ProgramBuilder WithZltoRewardReferrer(decimal? amount) { _zltoRewardReferrer = amount; return this; }
    public ProgramBuilder WithZltoRewardReferee(decimal? amount) { _zltoRewardReferee = amount; return this; }
    public ProgramBuilder WithZltoRewardPool(decimal? pool) { _zltoRewardPool = pool; return this; }
    public ProgramBuilder WithZltoRewardCumulative(decimal? amount) { _zltoRewardCumulative = amount; return this; }
    public ProgramBuilder WithProofOfPersonhoodRequired(bool required) { _proofOfPersonhoodRequired = required; return this; }
    public ProgramBuilder WithPathwayRequired(bool required) { _pathwayRequired = required; return this; }
    public ProgramBuilder WithMultipleLinksAllowed(bool allowed) { _multipleLinksAllowed = allowed; return this; }

    public ProgramBuilder WithStatus(Domain.Referral.ProgramStatus status)
    {
      _status = status;
      _statusId = status switch
      {
        Domain.Referral.ProgramStatus.Active => LookupBuilder.ProgramStatusActiveId,
        Domain.Referral.ProgramStatus.Inactive => LookupBuilder.ProgramStatusInactiveId,
        Domain.Referral.ProgramStatus.Expired => LookupBuilder.ProgramStatusExpiredId,
        Domain.Referral.ProgramStatus.LimitReached => LookupBuilder.ProgramStatusLimitReachedId,
        Domain.Referral.ProgramStatus.UnCompletable => LookupBuilder.ProgramStatusUnCompletableId,
        Domain.Referral.ProgramStatus.Deleted => LookupBuilder.ProgramStatusDeletedId,
        _ => throw new ArgumentOutOfRangeException(nameof(status))
      };
      return this;
    }

    public ProgramBuilder AsDefault() { _isDefault = true; return this; }
    public ProgramBuilder WithDateStart(DateTimeOffset dateStart) { _dateStart = dateStart; return this; }
    public ProgramBuilder WithDateEnd(DateTimeOffset? dateEnd) { _dateEnd = dateEnd; return this; }
    public ProgramBuilder WithPathway(ProgramPathway? pathway) { _pathway = pathway; return this; }
    public ProgramBuilder WithCountries(List<Country>? countries) { _countries = countries; return this; }

    public ProgramBuilder WithRewards(decimal referrer, decimal referee, decimal pool)
    {
      _zltoRewardReferrer = referrer;
      _zltoRewardReferee = referee;
      _zltoRewardPool = pool;
      return this;
    }

    public Program Build() => new()
    {
      Id = _id,
      Name = _name,
      Description = _description,
      CompletionWindowInDays = _completionWindowInDays,
      CompletionLimitReferee = _completionLimitReferee,
      CompletionLimit = _completionLimit,
      CompletionTotal = _completionTotal,
      ZltoRewardReferrer = _zltoRewardReferrer,
      ZltoRewardReferee = _zltoRewardReferee,
      ZltoRewardPool = _zltoRewardPool,
      ZltoRewardCumulative = _zltoRewardCumulative,
      ProofOfPersonhoodRequired = _proofOfPersonhoodRequired,
      PathwayRequired = _pathwayRequired,
      MultipleLinksAllowed = _multipleLinksAllowed,
      StatusId = _statusId,
      Status = _status,
      IsDefault = _isDefault,
      DateStart = _dateStart,
      DateEnd = _dateEnd,
      DateCreated = _dateCreated,
      CreatedByUserId = _createdByUserId,
      DateModified = _dateModified,
      ModifiedByUserId = _modifiedByUserId,
      Pathway = _pathway,
      Countries = _countries
    };
  }
}

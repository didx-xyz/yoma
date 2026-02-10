using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Test.Referral.Builders
{
  public class ProgramInfoBuilder
  {
    private Guid _id = Guid.NewGuid();
    private string _name = "Test Referral Program";
    private string? _description = "A test referral program";
    private string? _imageURL;
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
    private Domain.Referral.ProgramStatus _status = Domain.Referral.ProgramStatus.Active;
    private bool _isDefault;
    private DateTimeOffset _dateStart = DateTimeOffset.UtcNow.AddDays(-1);
    private DateTimeOffset? _dateEnd;
    private ProgramPathwayInfo? _pathway;
    private List<Country>? _countries;

    public ProgramInfoBuilder WithId(Guid id) { _id = id; return this; }
    public ProgramInfoBuilder WithName(string name) { _name = name; return this; }
    public ProgramInfoBuilder WithCompletionLimit(int? limit) { _completionLimit = limit; return this; }
    public ProgramInfoBuilder WithCompletionLimitReferee(int? limit) { _completionLimitReferee = limit; return this; }
    public ProgramInfoBuilder WithCompletionTotal(int? total) { _completionTotal = total; return this; }
    public ProgramInfoBuilder WithZltoRewardPool(decimal? pool) { _zltoRewardPool = pool; return this; }
    public ProgramInfoBuilder WithZltoRewardCumulative(decimal? amount) { _zltoRewardCumulative = amount; return this; }
    public ProgramInfoBuilder WithMultipleLinksAllowed(bool allowed) { _multipleLinksAllowed = allowed; return this; }

    public ProgramInfoBuilder WithStatus(Domain.Referral.ProgramStatus status)
    {
      _status = status;
      return this;
    }

    public ProgramInfoBuilder WithDateStart(DateTimeOffset dateStart) { _dateStart = dateStart; return this; }
    public ProgramInfoBuilder WithDateEnd(DateTimeOffset? dateEnd) { _dateEnd = dateEnd; return this; }
    public ProgramInfoBuilder WithCountries(List<Country>? countries) { _countries = countries; return this; }

    public ProgramInfoBuilder WithRewards(decimal referrer, decimal referee, decimal pool)
    {
      _zltoRewardReferrer = referrer;
      _zltoRewardReferee = referee;
      _zltoRewardPool = pool;
      return this;
    }

    public ProgramInfoBuilder FromProgram(Domain.Referral.Models.Program program)
    {
      _id = program.Id;
      _name = program.Name;
      _description = program.Description;
      _completionWindowInDays = program.CompletionWindowInDays;
      _completionLimitReferee = program.CompletionLimitReferee;
      _completionLimit = program.CompletionLimit;
      _completionTotal = program.CompletionTotal;
      _zltoRewardReferrer = program.ZltoRewardReferrer;
      _zltoRewardReferee = program.ZltoRewardReferee;
      _zltoRewardPool = program.ZltoRewardPool;
      _zltoRewardCumulative = program.ZltoRewardCumulative;
      _proofOfPersonhoodRequired = program.ProofOfPersonhoodRequired;
      _pathwayRequired = program.PathwayRequired;
      _multipleLinksAllowed = program.MultipleLinksAllowed;
      _status = program.Status;
      _isDefault = program.IsDefault;
      _dateStart = program.DateStart;
      _dateEnd = program.DateEnd;
      _countries = program.Countries;
      return this;
    }

    public ProgramInfo Build() => new()
    {
      Id = _id,
      Name = _name,
      Description = _description,
      ImageURL = _imageURL,
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
      Status = _status,
      IsDefault = _isDefault,
      DateStart = _dateStart,
      DateEnd = _dateEnd,
      Pathway = _pathway,
      Countries = _countries
    };
  }
}

using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A concrete Task the referee must complete as part of a Step.
  ///
  /// Phase 1 supports EntityType = Opportunity (complete a specific opportunity).
  ///
  /// Task ordering within a step:
  ///
  /// • OrderMode = Sequential → enforce sequential execution (Order = 1..N).
  /// • OrderMode = AnyOrder → tasks can be completed in any order (Order = null).
  ///
  /// Notes:
  /// - When Step Rule = Any, task order must always be null.
  /// - OrderDisplay always reflects creation/display order from the UI.
  /// - Task order is only meaningful when the parent step Rule = All
  ///   and the step has more than one task.
  /// </summary>
  public class ProgramPathwayTask
  {
    #region Public Members
    public Guid Id { get; set; }

    public Guid StepId { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    [JsonIgnore]
    public List<Domain.Lookups.Models.Country>? ProgramCountries { get; set; }

    public bool IsCompletable
    {
      get
      {
       var result = Completable(out var reason);
        NonCompletableReason = reason;
        return result;  
      }
    }

    public string? NonCompletableReason { get; private set; }
    #endregion

    #region Private Members
    private bool Completable(out string? reason)
    {
      reason = null;

      var countryCodeWorldwide = Country.Worldwide.ToDescription();

      // Program: null/empty => treat as Worldwide
      var programCountryCodes = ProgramCountries?.Select(c => c.CodeAlpha2).ToHashSet() ?? [];
      if (programCountryCodes.Count == 0) programCountryCodes.Add(countryCodeWorldwide);

      switch (EntityType)
      {
        case PathwayTaskEntityType.Opportunity:
          if (Opportunity == null)
            throw new DataInconsistencyException("Pathway task entity type is 'Opportunity' but no opportunity is assigned");

          if (!Opportunity.IsCompletable)
          {
            reason = Opportunity.NonCompletableReason;
            return false;
          }

          // Opportunity: null/empty => treat as Worldwide (currently countries are required, but keep future-proof fallback)
          var opportunityCountryCodes = Opportunity.Countries?.Select(c => c.CodeAlpha2).ToHashSet() ?? [];
          if (opportunityCountryCodes.Count == 0) opportunityCountryCodes.Add(countryCodeWorldwide);

          // Must share at least one country
          if (programCountryCodes.Overlaps(opportunityCountryCodes)) return true;

          reason = $"Opportunity '{Opportunity.Title}' is not available in any of the countries assigned to the program";
          return false;

        default:
          throw new InvalidOperationException($"Unsupported pathway task entity type: {EntityType}");
      }
    }
    #endregion
  }
}

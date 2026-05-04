using Flurl;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Extensions
{
  public static class ProgramExtensions
  {
    #region Public Members
    public static string ReferrerURL(this Program value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      if (value.Id == Guid.Empty) throw new ArgumentException("Id cannot be empty", nameof(value));

      return appBaseURL.AppendPathSegment("referrals").AppendPathSegment($"program").AppendPathSegment(value.Id.ToString());
    }

    public static ProgramInfo ToInfo(this Program value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new ProgramInfo
      {
        Id = value.Id,
        Name = value.Name,
        Summary = value.Summary,
        Description = value.Description,
        ImageURL = value.ImageURL,
        CompletionWindowInDays = value.CompletionWindowInDays,
        CompletionLimitReferee = value.CompletionLimitReferee,
        CompletionLimit = value.CompletionLimit,
        CompletionTotal = value.CompletionTotal,
        CompletionBalance = value.CompletionBalance,
        ZltoRewardReferrer = value.ZltoRewardReferrer,
        ZltoRewardReferee = value.ZltoRewardReferee,
        ZltoRewardEstimate = value.ZltoRewardEstimate,
        ZltoRewardPool = value.ZltoRewardPool,
        ZltoRewardCumulative = value.ZltoRewardCumulative,
        ZltoRewardBalance = value.ZltoRewardBalance,
        ProofOfPersonhoodRequired = value.ProofOfPersonhoodRequired,
        PathwayRequired = value.PathwayRequired,
        MultipleLinksAllowed = value.MultipleLinksAllowed,
        Status = value.Status,
        IsDefault = value.IsDefault,
        ReferrerLimit = value.ReferrerLimit,
        ReferrerTotal = value.ReferrerTotal,
        ReferrerBalance = value.ReferrerBalance,
        DateStart = value.DateStart,
        DateEnd = value.DateEnd,
        Pathway = value.Pathway == null ? null : new ProgramPathwayInfo
        {
          Id = value.Pathway.Id,
          Name = value.Pathway.Name,
          Description = value.Pathway.Description,
          Rule = value.Pathway.Rule,
          OrderMode = value.Pathway.OrderMode,
          IsCompletable = value.Pathway.IsCompletable,
          Steps = value.Pathway.Steps?.Select(step => new ProgramPathwayStepInfo
          {
            Id = step.Id,
            Name = step.Name,
            Description = step.Description,
            Rule = step.Rule,
            OrderMode = step.OrderMode,
            Order = step.Order,
            OrderDisplay = step.OrderDisplay,
            IsCompletable = step.IsCompletable,
            Tasks = step.Tasks?.Select(task => new ProgramPathwayTaskInfo
            {
              Id = task.Id,
              EntityType = task.EntityType,
              Order = task.Order,
              OrderDisplay = task.OrderDisplay,
              Opportunity = task.Opportunity == null ? null : new OpportunityItem
              {
                Id = task.Opportunity.Id,
                Title = task.Opportunity.Title,
                OrganizationName = task.Opportunity.OrganizationName,
                OrganizationLogoId = task.Opportunity.OrganizationLogoId,
                OrganizationLogoStorageType = task.Opportunity.OrganizationLogoStorageType,
                OrganizationLogoKey = task.Opportunity.OrganizationLogoKey,
                OrganizationLogoURL = task.Opportunity.OrganizationLogoURL, // Map; Optional; resolved by the invoking member when required
                OrganizationStatus = task.Opportunity.OrganizationStatus,
                OrganizationZltoRewardPoolCurrentFinancialYear = task.Opportunity.OrganizationZltoRewardPoolCurrentFinancialYear,
                OrganizationZltoRewardCumulativeCurrentFinancialYear = task.Opportunity.OrganizationZltoRewardCumulativeCurrentFinancialYear,
                OrganizationYomaRewardPoolCurrentFinancialYear = task.Opportunity.OrganizationYomaRewardPoolCurrentFinancialYear,
                OrganizationYomaRewardCumulativeCurrentFinancialYear = task.Opportunity.OrganizationYomaRewardCumulativeCurrentFinancialYear,
                VerificationEnabled = task.Opportunity.VerificationEnabled,
                VerificationMethod = task.Opportunity.VerificationMethod,
                Status = task.Opportunity.Status,
                Hidden = task.Opportunity.Hidden,
                DateStart = task.Opportunity.DateStart,
                Type = task.Opportunity.Type,
                ZltoReward = task.Opportunity.ZltoReward,
                ZltoRewardPool = task.Opportunity.ZltoRewardPool,
                ZltoRewardCumulative = task.Opportunity.ZltoRewardCumulative,
                YomaReward = task.Opportunity.YomaReward,
                YomaRewardPool = task.Opportunity.YomaRewardPool,
                YomaRewardCumulative = task.Opportunity.YomaRewardCumulative,
                Countries = task.Opportunity.Countries
              },
              ProgramCountries = task.ProgramCountries,
              IsCompletable = task.IsCompletable,
              NonCompletableReason = task.NonCompletableReason
            }).ToList() ?? []
          }).ToList() ?? []
        },
        Countries = value.Countries
      };
    }

    public static void CalculateEstimatedReward(this Program program, decimal? treasuryZltoRewardBalanceCurrentFinancialYear)
    {
      ArgumentNullException.ThrowIfNull(program, nameof(program));

      var estimate = new ProgramRewardEstimate();

      CalculateProgramRewardEstimate(program, treasuryZltoRewardBalanceCurrentFinancialYear, estimate);

      var (pathwayMinimum, pathwayMaximum) = CalculatePathwayRewardEstimate(program.Pathway, treasuryZltoRewardBalanceCurrentFinancialYear);

      estimate.RefereePathwayMinimum = pathwayMinimum;
      estimate.RefereePathwayMaximum = pathwayMaximum;

      program.ZltoRewardEstimate = estimate;
    }
    #endregion

    #region Private Members
    private static void CalculateProgramRewardEstimate(Program program, decimal? treasuryZltoRewardBalanceCurrentFinancialYear, ProgramRewardEstimate estimate)
    {
      var refereeTarget = program.ZltoRewardReferee;
      var referrerTarget = program.ZltoRewardReferrer;

      decimal? available = null;

      if (treasuryZltoRewardBalanceCurrentFinancialYear.HasValue)
        available = Math.Max(treasuryZltoRewardBalanceCurrentFinancialYear.Value, default);

      if (program.ZltoRewardPool.HasValue)
      {
        var programBalance = Math.Max(program.ZltoRewardBalance ?? default, default);
        available = available.HasValue ? Math.Min(available.Value, programBalance) : programBalance;
      }

      if (!available.HasValue)
      {
        estimate.Referee = refereeTarget;
        estimate.Referrer = referrerTarget;
        return;
      }

      var pool = available.Value;

      if (refereeTarget.HasValue)
      {
        estimate.Referee = Math.Min(pool, refereeTarget.Value);
        pool -= estimate.Referee.Value;
      }

      if (referrerTarget.HasValue)
        estimate.Referrer = Math.Min(pool, referrerTarget.Value);
    }

    private static (decimal? Minimum, decimal? Maximum) CalculatePathwayRewardEstimate(
      ProgramPathway? pathway,
      decimal? treasuryZltoRewardBalanceCurrentFinancialYear)
    {
      if (pathway?.Steps == null || pathway.Steps.Count == 0)
        return (null, null);

      decimal? minimum = null;
      decimal? maximum = null;

      foreach (var step in pathway.Steps)
      {
        var (stepMinimum, stepMaximum) = CalculateStepRewardEstimate(step, treasuryZltoRewardBalanceCurrentFinancialYear);

        switch (pathway.Rule)
        {
          case PathwayCompletionRule.All:
            minimum = minimum.HasValue || stepMinimum.HasValue
              ? (minimum ?? default) + (stepMinimum ?? default)
              : null;

            maximum = maximum.HasValue || stepMaximum.HasValue
              ? (maximum ?? default) + (stepMaximum ?? default)
              : null;
            break;

          case PathwayCompletionRule.Any:
            minimum = minimum.HasValue
              ? stepMinimum.HasValue ? Math.Min(minimum.Value, stepMinimum.Value) : minimum
              : stepMinimum;

            maximum = maximum.HasValue
              ? stepMaximum.HasValue ? Math.Max(maximum.Value, stepMaximum.Value) : maximum
              : stepMaximum;
            break;

          default:
            throw new InvalidOperationException($"Unsupported pathway completion rule '{pathway.Rule}'");
        }
      }

      return (minimum, maximum);
    }

    private static (decimal? Minimum, decimal? Maximum) CalculateStepRewardEstimate(
      ProgramPathwayStep step,
      decimal? treasuryZltoRewardBalanceCurrentFinancialYear)
    {
      if (step.Tasks == null || step.Tasks.Count == 0)
        return (null, null);

      decimal? minimum = null;
      decimal? maximum = null;

      foreach (var task in step.Tasks)
      {
        var reward = CalculateTaskRewardEstimate(task, treasuryZltoRewardBalanceCurrentFinancialYear);

        switch (step.Rule)
        {
          case PathwayCompletionRule.All:
            minimum = minimum.HasValue || reward.HasValue
              ? (minimum ?? default) + (reward ?? default)
              : null;

            maximum = maximum.HasValue || reward.HasValue
              ? (maximum ?? default) + (reward ?? default)
              : null;
            break;

          case PathwayCompletionRule.Any:
            minimum = minimum.HasValue
              ? reward.HasValue ? Math.Min(minimum.Value, reward.Value) : minimum
              : reward;

            maximum = maximum.HasValue
              ? reward.HasValue ? Math.Max(maximum.Value, reward.Value) : maximum
              : reward;
            break;

          default:
            throw new InvalidOperationException($"Unsupported pathway step completion rule '{step.Rule}'");
        }
      }

      return (minimum, maximum);
    }

    private static decimal? CalculateTaskRewardEstimate(ProgramPathwayTask task, decimal? treasuryZltoRewardBalanceCurrentFinancialYear)
    {
      switch (task.EntityType)
      {
        case PathwayTaskEntityType.Opportunity:
          if (task.Opportunity == null)
            throw new InvalidOperationException("Pathway task entity type is 'Opportunity' but no opportunity is assigned");

          return OpportunityExtensions.CalculateEstimatedReward(
            task.Opportunity.ZltoReward,
            treasuryZltoRewardBalanceCurrentFinancialYear,
            task.Opportunity.OrganizationZltoRewardBalanceCurrentFinancialYear,
            task.Opportunity.ZltoRewardBalance);

        default:
          throw new InvalidOperationException($"Unsupported pathway task entity type '{task.EntityType}'");
      }
    }
    #endregion
  }
}

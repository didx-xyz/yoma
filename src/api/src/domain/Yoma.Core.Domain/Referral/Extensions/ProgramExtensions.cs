using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Extensions
{
  public static class ProgramExtensions
  {
    public static ProgramInfo ToInfo(this Program value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new ProgramInfo
      {
        Id = value.Id,
        Name = value.Name,
        Description = value.Description,
        ImageURL = value.ImageURL,
        CompletionWindowInDays = value.CompletionWindowInDays,
        CompletionLimitReferee = value.CompletionLimitReferee,
        CompletionLimit = value.CompletionLimit,
        CompletionTotal = value.CompletionTotal,
        //CompletionBalance: calculated inline
        ZltoRewardReferrer = value.ZltoRewardReferrer,
        ZltoRewardReferee = value.ZltoRewardReferee,
        ZltoRewardPool = value.ZltoRewardPool,
        ZltoRewardCumulative = value.ZltoRewardCumulative,
        //ZltoRewardBalance: calculated inline
        ProofOfPersonhoodRequired = value.ProofOfPersonhoodRequired,
        PathwayRequired = value.PathwayRequired,
        Status = value.Status,
        IsDefault = value.IsDefault,
        DateStart = value.DateStart,
        DateEnd = value.DateEnd,

        Pathway = value.Pathway == null ? null : new ProgramPathwayInfo
        {
          Id = value.Pathway.Id,
          Name = value.Pathway.Name,
          Description = value.Pathway.Description,
          Steps = value.Pathway.Steps?.Select(step => new ProgramPathwayStepInfo
          {
            Id = step.Id,
            Name = step.Name,
            Description = step.Description,
            Rule = step.Rule,
            Order = step.Order,
            Tasks = step.Tasks?.Select(task => new ProgramPathwayTaskInfo
            {
              Id = task.Id,
              EntityType = task.EntityType,
              Order = task.Order,
              Opportunity = task.Opportunity == null ? null : new OpportunityItem
              {
                Id = task.Opportunity.Id,
                Title = task.Opportunity.Title
              }
            }).ToList() ?? []
          }).ToList() ?? []
        }
      };
    }
  }
}

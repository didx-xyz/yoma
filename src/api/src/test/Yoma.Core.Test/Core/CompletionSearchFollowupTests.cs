using FluentValidation;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Validators;

namespace Yoma.Core.Test.Core
{
  public class CompletionSearchFollowupTests
  {
    #region Public Members
    [Theory]
    [InlineData(Domain.Opportunity.Type.Job, false)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship, false)]
    [InlineData(Domain.Opportunity.Type.Learning, true)]
    [InlineData(Domain.Opportunity.Type.Event, true)]
    public void PlacementMayOmitTimingButLearningAndEventsStillRequireIt(Domain.Opportunity.Type type, bool required)
    {
      var request = new MyOpportunityRequestVerify { DateEnd = DateTimeOffset.UtcNow };
      var validator = new MyOpportunityRequestValidatorVerify(Mock.Of<ITimeIntervalService>(), Mock.Of<ICountryService>());
      var context = new ValidationContext<MyOpportunityRequestVerify>(request);
      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = type;

      var errors = validator.Validate(context).Errors;
      Assert.Equal(required, errors.Any(o => o.PropertyName == nameof(request.DateStart)));
      Assert.Equal(required, errors.Any(o => o.PropertyName == nameof(request.CommitmentInterval)));

      request.DateStart = request.DateEnd.Value.AddDays(1);
      Assert.Contains(validator.Validate(context).Errors, o => o.PropertyName == nameof(request.DateEnd));
    }

    [Fact]
    public void JobDoesNotDeriveParticipationFromAdvertisedEffort()
    {
      var request = new MyOpportunityRequestVerify();
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Type = Domain.Opportunity.Type.Job,
        CommitmentIntervalId = Guid.NewGuid(),
        CommitmentInterval = TimeIntervalOption.Hour,
        CommitmentIntervalCount = 4
      };
      var defaults = typeof(MyOpportunityService).GetMethod("PerformActionSendForVerificationApplyDefaults",
        BindingFlags.Static | BindingFlags.NonPublic)!;
      defaults.Invoke(null, [request, opportunity, new MyOpportunityVerificationOptions()]);

      Assert.NotNull(request.DateEnd);
      Assert.Null(request.DateStart);
      Assert.Null(request.CommitmentInterval);
    }

    #endregion
  }
}

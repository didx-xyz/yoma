using FluentValidation;
using Moq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
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

    [Theory]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship)]
    [InlineData(Domain.Opportunity.Type.Learning)]
    [InlineData(Domain.Opportunity.Type.Event)]
    [InlineData(Domain.Opportunity.Type.ImpactAction)]
    [InlineData(Domain.Opportunity.Type.Other)]
    public void MissingParticipationEndDefaultsToTodayOnlyForJobsAfterDeadline(Domain.Opportunity.Type type)
    {
      var before = DateTimeOffset.UtcNow;
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Type = type,
        DateEnd = before.AddDays(-10).ToEndOfDay()
      };
      var request = new MyOpportunityRequestVerify();

      ApplyDefaults(request, opportunity, false);

      if (type == Domain.Opportunity.Type.Job)
        Assert.InRange(request.DateEnd!.Value, before, DateTimeOffset.UtcNow);
      else
        Assert.Equal(opportunity.DateEnd, request.DateEnd);

      Assert.Null(request.CommitmentInterval);
      Assert.Null(request.DateStart);
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(Domain.Opportunity.Type.Learning)]
    public void AutoFinalizedCompletionDoesNotReceiveDefaultTiming(Domain.Opportunity.Type type)
    {
      var request = new MyOpportunityRequestVerify();
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Type = type,
        DateEnd = DateTimeOffset.UtcNow.AddDays(-10)
      };

      ApplyDefaults(request, opportunity, true);

      Assert.Null(request.DateEnd);
      Assert.Null(request.DateStart);
      Assert.Null(request.CommitmentInterval);
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship)]
    [InlineData(Domain.Opportunity.Type.Learning)]
    [InlineData(Domain.Opportunity.Type.Event)]
    [InlineData(Domain.Opportunity.Type.ImpactAction)]
    [InlineData(Domain.Opportunity.Type.Other)]
    public void OnlyJobPlacementCanBeReportedAfterApplicationDeadline(Domain.Opportunity.Type type)
    {
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Type = type,
        DateStart = DateTimeOffset.UtcNow.AddDays(-30).RemoveTime(),
        DateEnd = DateTimeOffset.UtcNow.AddDays(-10).ToEndOfDay()
      };
      var end = DateTimeOffset.UtcNow.AddDays(-2);
      var request = new MyOpportunityRequestVerify { DateEnd = end };

      ApplyDefaults(request, opportunity, false);
      Assert.Equal(end, request.DateEnd);

      var exception = Record.Exception(() => ParseCommitment(request, opportunity));
      if (type == Domain.Opportunity.Type.Job)
      {
        Assert.Null(exception);
        Assert.Equal(end.ToEndOfDay(), request.DateEnd);
      }
      else
      {
        var validation = Assert.IsType<ValidationException>(Assert.IsType<TargetInvocationException>(exception).InnerException);
        Assert.Contains("End date cannot be later than the opportunity end date", validation.Message);
      }
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void JobPlacementStillRejectsFutureEndAndStartBeforeOpportunity(bool futureEnd)
    {
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Type = Domain.Opportunity.Type.Job,
        DateStart = DateTimeOffset.UtcNow.AddDays(-30).RemoveTime(),
        DateEnd = DateTimeOffset.UtcNow.AddDays(-10).ToEndOfDay()
      };
      var request = new MyOpportunityRequestVerify
      {
        DateStart = futureEnd ? null : opportunity.DateStart.AddDays(-1),
        DateEnd = DateTimeOffset.UtcNow.AddDays(futureEnd ? 1 : -2)
      };

      var exception = Assert.Throws<TargetInvocationException>(() => ParseCommitment(request, opportunity));
      var validation = Assert.IsType<ValidationException>(exception.InnerException);
      Assert.Contains(futureEnd ? "End date cannot be in the future" : "Start date can not be earlier", validation.Message);
    }
    #endregion

    #region Private Members
    private static void ApplyDefaults(MyOpportunityRequestVerify request, Domain.Opportunity.Models.Opportunity opportunity, bool autoFinalized)
    {
      var method = typeof(MyOpportunityService).GetMethod("PerformActionSendForVerificationApplyDefaults", BindingFlags.Static | BindingFlags.NonPublic)!;
      method.Invoke(null, [request, opportunity, new MyOpportunityVerificationOptions { PartnerSyncedVerification = autoFinalized }]);
    }

    private static void ParseCommitment(MyOpportunityRequestVerify request, Domain.Opportunity.Models.Opportunity opportunity)
    {
      // These cases have no commitment to resolve; exercise date checks without external dependencies.
      var service = (MyOpportunityService)RuntimeHelpers.GetUninitializedObject(typeof(MyOpportunityService));
      var method = typeof(MyOpportunityService).GetMethod("PerformActionSendForVerificationParseCommitment", BindingFlags.Instance | BindingFlags.NonPublic)!;
      method.Invoke(service, [request, opportunity]);
    }
    #endregion
  }
}

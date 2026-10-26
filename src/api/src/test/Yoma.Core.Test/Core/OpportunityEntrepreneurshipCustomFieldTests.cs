using FluentValidation;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;

namespace Yoma.Core.Test.Core
{
  public class OpportunityEntrepreneurshipCustomFieldTests
  {
    #region Tests

    [Theory]
    [InlineData(null, null, true, true)]
    [InlineData("BeGreen", null, true, true)]
    [InlineData("Other", "New programme", true, true)]
    [InlineData("Other", null, true, false)]
    [InlineData(null, "New programme", true, false)]
    [InlineData("BeGreen", "New programme", true, false)]
    [InlineData(null, null, false, true)]
    [InlineData("Other", null, false, true)]
    [InlineData(null, "New programme", false, true)]
    [InlineData("BeGreen", null, false, true)]
    [InlineData("BeGreen", "New programme", false, false)]
    public void ProgrammeOtherCompanionsRespectManualAndExternalRequiredness(
      string? programme, string? description, bool enforceRequired, bool valid)
    {
      var fields = new List<CustomFieldValueItem>();
      if (programme != null)
        fields.Add(new CustomFieldValueItem
        {
          Key = CustomFieldConstants.Entrepreneurship.Programme.Type,
          DataType = CustomFieldDataType.Option,
          ValueRaw = programme
        });

      if (description != null)
        fields.Add(new CustomFieldValueItem
        {
          Key = CustomFieldConstants.Entrepreneurship.Programme.OtherDescription,
          DataType = CustomFieldDataType.String,
          ValueRaw = description
        });

      var method = typeof(OpportunityService).GetMethod("AssertCrossFieldRules", BindingFlags.NonPublic | BindingFlags.Static)!;
      Exception? exception = null;
      try
      {
        method.Invoke(null, [new Domain.Opportunity.Models.Opportunity
        {
          Type = Domain.Opportunity.Type.Entrepreneurship,
          CustomFields = fields
        }, enforceRequired]);
      }
      catch (TargetInvocationException error) when (error.InnerException != null)
      {
        exception = error.InnerException;
      }

      if (valid) Assert.Null(exception);
      else Assert.IsType<ValidationException>(exception);
    }

    [Fact]
    public void ManualVentureOutcomeMayOmitParticipationPeriod()
    {
      var validator = new MyOpportunityRequestValidatorVerify(Mock.Of<ITimeIntervalService>(), Mock.Of<ICountryService>());
      var request = new MyOpportunityRequestVerify { DateEnd = DateTimeOffset.UtcNow };
      var context = new ValidationContext<MyOpportunityRequestVerify>(request);
      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = Domain.Opportunity.Type.Entrepreneurship;

      var errors = validator.Validate(context).Errors;
      Assert.DoesNotContain(errors, o => o.PropertyName == nameof(request.DateStart));
      Assert.DoesNotContain(errors, o => o.PropertyName == nameof(request.CommitmentInterval));

      request.CommitmentInterval = new MyOpportunityRequestVerifyCommitmentInterval
      {
        Id = Guid.Empty,
        Count = 0
      };
      errors = validator.Validate(context).Errors;
      Assert.Contains(errors, o => o.PropertyName == $"{nameof(request.CommitmentInterval)}.Id");
      Assert.Contains(errors, o => o.PropertyName == $"{nameof(request.CommitmentInterval)}.Count");

      request.CommitmentInterval = null;

      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = Domain.Opportunity.Type.Event;
      errors = validator.Validate(context).Errors;
      Assert.Contains(errors, o => o.PropertyName == nameof(request.DateStart));
    }
    #endregion

    #region Private Members
    #endregion
  }
}

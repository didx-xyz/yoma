using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;
using OpportunityVerificationType = Yoma.Core.Domain.Opportunity.Models.Lookups.OpportunityVerificationType;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class OpportunityVerificationTypeValidationTests
  {
    #region Tests
    [Fact]
    public void NullEntryReturnsValidationFailureInsteadOfThrowing()
    {
      AssertVerificationTypes([null!], false);
    }

    [Fact]
    public void NullEntryAlongsideAValidTypeIsRejected()
    {
      AssertVerificationTypes([new() { Type = VerificationType.Picture }, null!], false);
    }

    [Fact]
    public void UnknownTypeIsRejected()
    {
      AssertVerificationTypes([new() { Type = (VerificationType)int.MaxValue }], false);
    }

    [Fact]
    public void ValidManualVerificationRemainsAccepted()
    {
      AssertVerificationTypes([new() { Type = VerificationType.Picture }], true);
    }

    [Fact]
    public void ManualVerificationStillRequiresAtLeastOneType()
    {
      AssertVerificationTypes(null, false);
      AssertVerificationTypes([], false);
    }

    [Fact]
    public void VerificationTypesRemainOptionalWithoutManualVerification()
    {
      AssertVerificationTypes(null, true, null);
      AssertVerificationTypes([], true, null);
    }
    #endregion

    #region Private Members
    private static void AssertVerificationTypes(List<OpportunityRequestVerificationType>? types, bool valid,
      VerificationMethod? method = VerificationMethod.Manual)
    {
      var countries = Mock.Of<ICountryService>();
      var verificationTypes = new Mock<IOpportunityVerificationTypeService>();
      verificationTypes.Setup(service => service.GetByTypeOrNull(VerificationType.Picture))
        .Returns(new OpportunityVerificationType());
      var create = new OpportunityRequestValidatorCreate(Mock.Of<IOpportunityTypeService>(),
        Mock.Of<IOrganizationService>(), Mock.Of<IEngagementTypeService>(), Mock.Of<ITimeIntervalService>(),
        Mock.Of<IOpportunityCategoryService>(), countries, Mock.Of<ILanguageService>(), Mock.Of<ISkillService>(),
        verificationTypes.Object, new OpportunityRequestCountryValidator(countries, new CoordinatesValidator()),
        Mock.Of<ICurrencyService>(), Mock.Of<IAccessibilityService>(), Mock.Of<ITargetedGroupService>(),
        Mock.Of<ISustainableDevelopmentGoalService>());
      var update = new OpportunityRequestValidatorUpdate(Mock.Of<IOpportunityTypeService>(),
        Mock.Of<IOrganizationService>(), Mock.Of<IEngagementTypeService>(), Mock.Of<ITimeIntervalService>(),
        Mock.Of<IOpportunityCategoryService>(), countries, Mock.Of<ILanguageService>(), Mock.Of<ISkillService>(),
        verificationTypes.Object, new OpportunityRequestCountryValidator(countries, new CoordinatesValidator()),
        Mock.Of<ICurrencyService>(), Mock.Of<IAccessibilityService>(), Mock.Of<ITargetedGroupService>(),
        Mock.Of<ISustainableDevelopmentGoalService>());

      var createResult = create.Validate(new OpportunityRequestCreate
      {
        VerificationTypes = types,
        VerificationMethod = method
      }, options => options.IncludeProperties(request => request.VerificationTypes));
      var updateResult = update.Validate(new OpportunityRequestUpdate
      {
        VerificationTypes = types,
        VerificationMethod = method
      }, options => options.IncludeProperties(request => request.VerificationTypes));

      Assert.Equal(valid, createResult.IsValid);
      Assert.Equal(valid, updateResult.IsValid);
      if (types?.Any(type => type == null) == true)
      {
        const string message = "Verification types must contain non-empty entries with valid types if specified.";
        Assert.Contains(createResult.Errors, error => error.ErrorMessage == message);
        Assert.Contains(updateResult.Errors, error => error.ErrorMessage == message);
      }
    }
    #endregion
  }
}

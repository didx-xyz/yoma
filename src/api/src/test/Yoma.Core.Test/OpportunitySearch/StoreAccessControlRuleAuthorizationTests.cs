using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Services;
using Yoma.Core.Domain.Marketplace.Validators;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class StoreAccessControlRuleAuthorizationTests
  {
    #region Tests
    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    public void SearchRequiresMembershipUnlessTheCallerIsASystemAdmin(bool systemAdmin, bool hasMembership)
    {
      var ownOrganizationId = Guid.NewGuid();
      var ownRule = new StoreAccessControlRule { Id = Guid.NewGuid(), OrganizationId = ownOrganizationId, Name = "Own rule" };
      var otherRule = new StoreAccessControlRule { Id = Guid.NewGuid(), OrganizationId = Guid.NewGuid(), Name = "Other rule" };
      var repository = new Mock<IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule>>();
      repository.Setup(service => service.Query(true)).Returns(new[] { ownRule, otherRule }.AsQueryable());
      var organizations = new Mock<IOrganizationService>();
      organizations.Setup(service => service.ListAdminsOf(false)).Returns(hasMembership
        ? [new OrganizationInfoAdmin { Id = ownOrganizationId }] : []);
      var accessor = MockHttpContextAccessor.Create("admin@example.invalid",
        systemAdmin ? Constants.Role_Admin : Constants.Role_OrganizationAdmin);
      var countries = Mock.Of<ICountryService>();
      var genders = Mock.Of<IGenderService>();
      var service = new StoreAccessControlRuleService(Options.Create(new AppSettings()), Mock.Of<IDistributedCacheService>(),
        accessor.Object, Mock.Of<IStoreAccessControlRuleStatusService>(), organizations.Object, countries, genders,
        Mock.Of<IOpportunityService>(), Mock.Of<IUserService>(), Mock.Of<IMyOpportunityActionService>(),
        Mock.Of<IMyOpportunityVerificationStatusService>(), new StoreAccessControlRuleSearchFilterValidator(),
        new StoreAccessControlRuleRequestValidatorCreate(countries, genders), new StoreAccessControlRuleRequestValidatorUpdate(countries, genders),
        repository.Object, Mock.Of<IRepository<StoreAccessControlRuleOpportunity>>(), Mock.Of<IRepositoryValueContainsWithNavigation<User>>(),
        Mock.Of<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>>(), Mock.Of<IExecutionStrategyService>());
      var filter = new StoreAccessControlRuleSearchFilter { PageNumber = 1, PageSize = 10 };

      if (!systemAdmin && !hasMembership)
        Assert.Throws<SecurityException>(() => service.Search(filter, true));
      else
      {
        var result = service.Search(filter, true);
        if (systemAdmin)
          Assert.Equal(2, result.Items.Count);
        else
          Assert.Equal(ownRule.Id, Assert.Single(result.Items).Id);
      }
    }
    #endregion
  }
}

using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
  public interface IOpportunityService
  {
    Models.Opportunity GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems, bool includeComputed);

    List<Models.Opportunity> Contains(string value, bool includeComputed);

    OpportunitySearchResultsCriteria SearchCriteriaOpportunities(OpportunitySearchFilterCriteria filter, bool ensureOrganizationAuthorization);

    List<Models.Lookups.OpportunityCategory> ListOpportunitySearchCriteriaCategoriesAdmin(Guid? organizationId, bool ensureOrganizationAuthorization);

    List<Models.Lookups.OpportunityCategory> ListOpportunitySearchCriteriaCategories(List<PublishedState>? publishedStates);

    List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountriesAdmin(Guid? organizationId, bool ensureOrganizationAuthorization);

    List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountries(List<PublishedState>? publishedStates);

    List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguagesAdmin(Guid? organizationId, bool ensureOrganizationAuthorization);

    List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguages(List<PublishedState>? publishedStates);

    List<OrganizationInfo> ListOpportunitySearchCriteriaOrganizationsAdmin();

    List<OrganizationInfo> ListOpportunitySearchCriteriaOrganizations(List<PublishedState>? publishedStates);

    List<OpportunitySearchCriteriaCommitmentInterval> ListOpportunitySearchCriteriaCommitmentInterval(List<PublishedState>? publishedStates);

    List<OpportunitySearchCriteriaZltoReward> ListOpportunitySearchCriteriaZltoReward(List<PublishedState>? publishedStates);

    OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization);

    Task<OpportunityAllocateRewardResponse> AllocateRewards(Guid id, Guid userId, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> AssignCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> RemoveCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> AssignCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> RemoveCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> AssignLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> RemoveLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> AssignSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> RemoveSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> AssignVerificationTypes(Guid id, List<OpportunityRequestVerificationType> verificationTypes, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> RemoveVerificationTypes(Guid id, List<VerificationType> verificationTypes, bool ensureOrganizationAuthorization);
  }
}

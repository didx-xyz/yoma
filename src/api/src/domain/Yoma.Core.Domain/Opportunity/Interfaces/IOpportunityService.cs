using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
  public interface IOpportunityService
  {
    Models.Opportunity GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems, bool includeComputed);

    Models.Opportunity GetByExternalId(Guid organizationId, string externalId, bool includeChildItems, bool includeComputed);

    Models.Opportunity? GetByExternalIdOrNull(Guid organizationId, string externalId, bool includeChildItems, bool includeComputed);

    List<Models.Opportunity> Contains(string value, bool includeChildItems, bool includeComputed);

    OpportunitySearchResultsCriteria SearchCriteriaOpportunities(OpportunitySearchFilterCriteria filter, bool ensureOrganizationAuthorization);

    List<Models.Lookups.OpportunityCategory> ListOpportunitySearchCriteriaCategoriesAdmin(List<Guid>? organizations, bool ensureOrganizationAuthorization);

    List<Models.Lookups.OpportunityCategory> ListOpportunitySearchCriteriaCategories(List<PublishedState>? publishedStates);

    List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountriesAdmin(List<Guid>? organizations, bool ensureOrganizationAuthorization);

    List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountries(List<PublishedState>? publishedStates);

    List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguagesAdmin(List<Guid>? organizations, bool ensureOrganizationAuthorization);

    List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguages(List<PublishedState>? publishedStates, string? languageCodeAlpha2Site);

    List<OrganizationInfo> ListOpportunitySearchCriteriaOrganizationsAdmin();

    List<OrganizationInfo> ListOpportunitySearchCriteriaOrganizations(List<PublishedState>? publishedStates);

    List<OpportunitySearchCriteriaCommitmentIntervalOption> ListOpportunitySearchCriteriaCommitmentIntervalOptions(List<PublishedState>? publishedStates);

    List<OpportunitySearchCriteriaZltoRewardRange> ListOpportunitySearchCriteriaZltoRewardRanges(List<PublishedState>? publishedStates);

    OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    Task ImportFromCSV(IFormFile file, Guid organizationId, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization, bool raiseEvent = true);

    Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization);

    Task<OpportunityAllocateRewardResponse> AllocateRewards(Guid id, bool ensureOrganizationAuthorization);

    Task<Models.Opportunity> UpdateFeatured(Guid id, bool featured);

    Task<Models.Opportunity> UpdateHidden(Guid id, bool hidden, bool ensureOrganizationAuthorization);

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

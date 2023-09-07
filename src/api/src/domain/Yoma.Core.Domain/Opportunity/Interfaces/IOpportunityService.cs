using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityService
    {
        Models.Opportunity GetById(Guid id, bool includeChildren, bool ensureOrganizationAuthorization);

        Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems);

        OpportunityInfo GetInfoById(Guid id, bool includeChildren);

        Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems);

        OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems);

        List<Models.Opportunity> Contains(string value);

        OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter);

        OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization);

        Task<(decimal? ZltoReward, decimal? YomaReward)> AllocateRewards(Guid id, bool ensureOrganizationAuthorization);

        Task UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization);

        Task AssignCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization);

        Task DeleteCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization);

        Task AssignCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization);

        Task DeleteCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization);

        Task AssignLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization);

        Task DeleteLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization);

        Task AssignSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization);

        Task DeleteSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization);
    }
}

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

        Task<Models.Opportunity> UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> UpdateCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> UpdateCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> UpdateLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> UpdateSkills(Guid id, List<Guid>? skillIds, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> UpdateVerificationTypes(Guid id, Dictionary<VerificationType, string?>? verificationTypes, bool ensureOrganizationAuthorization);
    }
}

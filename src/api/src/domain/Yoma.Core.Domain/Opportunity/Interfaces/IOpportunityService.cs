using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityService
    {
        bool Active(Guid id, bool checkStarted, bool throwNotFound);

        bool Active(Models.Opportunity opportunity, bool checkStarted);

        Models.Opportunity GetById(Guid id, bool includeChildren, bool ensureOrganizationAuthorization);

        Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems);

        OpportunityInfo GetInfoById(Guid id, bool includeChildren);

        Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems);

        OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems);

        OpportunitySearchResultsInfo SearchInfo(OpportunitySearchFilterInfo filter);

        OpportunitySearchResults Search(OpportunitySearchFilter filter, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> Upsert(OpportunityRequest request, bool ensureOrganizationAuthorization);

        Task<(decimal? ZltoReward, decimal? YomaReward)> FinalizeVerification(Guid id, bool completed, bool ensureOrganizationAuthorization);

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

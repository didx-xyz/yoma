using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityService
    {
        Models.Opportunity GetById(Guid id, bool includeChildren, bool ensureOrganizationAuthorization);

        Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems);

        Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems);

        List<Models.Opportunity> Contains(string value);

        OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization);

        Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization);

        Task<(decimal? ZltoReward, decimal? YomaReward)> AllocateRewards(Guid id, bool ensureOrganizationAuthorization);

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

using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramService
  {
    Program GetById(Guid id, bool includeChildItems, bool includeComputed);

    Program? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed);

    Program? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed);

    Program? GetDefaultOrNull(bool includeChildItems, bool includeComputed);

    Program GetByLinkId(Guid linkId, bool includeChildItems, bool includeComputed);

    List<Domain.Lookups.Models.Country> ListSearchCriteriaCountries(List<PublishedState>? publishedStates);

    List<Domain.Lookups.Models.Country> ListSearchCriteriaCountriesAdmin();

    ProgramSearchResults Search(ProgramSearchFilterAdmin filter);

    Task<Program> Create(ProgramRequestCreate request);

    Task<Program> Update(ProgramRequestUpdate request);

    Task<Program> UpdateImage(Guid id, IFormFile file);

    Task<Program> UpdateStatus(Guid id, ProgramStatus status);

    Task<Program> SetAsDefault(Guid id);

    Task<Program> ProcessCompletion(Guid programId, decimal? rewardAmount);
  }
}

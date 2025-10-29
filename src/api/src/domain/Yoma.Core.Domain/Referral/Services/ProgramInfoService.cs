using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Referral.Extensions;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramInfoService : IProgramInfoService
  {
    #region Class Variables
    private readonly IProgramService _programService;
    #endregion

    #region Constructor
    public ProgramInfoService(IProgramService programService)
    {
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
    }
    #endregion

    #region Public Members
    public bool Available()
    {
      //active and started (published state active)
      var searchResults = _programService.Search(new ProgramSearchFilterAdmin
      {
        PublishedStates = [PublishedState.Active],
        TotalCountOnly = true
      });

      return searchResults.TotalCount > 0;
    }

    public ProgramInfo GetDefault()
    {
      var result = _programService.GetDefaultOrNull(true, true)
        ?? throw new EntityNotFoundException("Default program not found");

      //active and started
      if (result.Status != ProgramStatus.Active || result.DateStart > DateTimeOffset.UtcNow)
        throw new EntityNotFoundException($"Default program '{result.Name}' is currently unavailable");

      return result.ToInfo();
    }

    public ProgramInfo GetById(Guid id, bool includeChildItems, bool includeComputed, bool enforceAvailableOrExpired)
    {
      var result = _programService.GetById(id, includeChildItems, includeComputed);

      if (enforceAvailableOrExpired)
      {
        var statuses = new ProgramStatus[] { ProgramStatus.Active, ProgramStatus.Expired };
        if (!statuses.Contains(result.Status) || result.DateStart > DateTimeOffset.UtcNow)
          throw new EntityNotFoundException($"Program '{result.Name}' is currently unavailable");
      }

      return result.ToInfo();
    }

    public ProgramSearchResultsInfo Search(ProgramSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var filterInternal = new ProgramSearchFilterAdmin
      {
        PublishedStates = filter.PublishedStates == null || filter.PublishedStates.Count == 0 ? [PublishedState.Active] : filter.PublishedStates,
        ValueContains = filter.ValueContains,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      };

      var searchResults = _programService.Search(filterInternal);

      var results = new ProgramSearchResultsInfo
      {
        TotalCount = searchResults.TotalCount,
        Items = [.. searchResults.Items.Select(item => item.ToInfo())]
      };

      return results;
    }
    #endregion
  }
}

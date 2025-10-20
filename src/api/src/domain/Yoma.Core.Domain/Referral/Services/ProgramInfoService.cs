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
    public ProgramInfo GetById(Guid id)
    {
      var result = _programService.GetById(id, true, true);

      var (resultState, message) = result.ActiveOrExpired();

      if (!resultState) throw new EntityNotFoundException(message!);

      return result.ToInfo();
    }

    public ProgramSearchResultsInfo Search(ProgramSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var statuses = new List<ProgramStatus> { ProgramStatus.Active };
      if (filter.IncludeExpired == true)
        statuses.Add(ProgramStatus.Expired);

      var filterInternal = new ProgramSearchFilterAdmin
      {
        Statuses = statuses,
        ValueContains = filter.ValueContains,
        DateStart = filter.DateStart,
        DateEnd = filter.DateEnd,
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

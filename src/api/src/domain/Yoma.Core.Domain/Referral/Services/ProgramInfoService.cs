using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Referral.Extensions;
using Yoma.Core.Domain.Referral.Helpers;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramInfoService : IProgramInfoService
  {
    #region Class Variables
    private readonly IProgramService _programService;
    private readonly ICountryService _countryService;
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly ProgramStatus[] Statuses_AnonymousAllowed = [ProgramStatus.Active, ProgramStatus.UnCompletable];
    #endregion

    #region Constructor
    public ProgramInfoService(IProgramService programService,
      ICountryService countryService,
      IUserService userService,
      IHttpContextAccessor httpContextAccessor)
    {
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }
    #endregion

    #region Public Members
    public bool Available(List<Guid>? countries)
    {
      var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);
      var user = isAuthenticated ? _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false) : null;
      countries = ProgramCountryPolicy.ResolveAvailableCountriesForProgramSearch(countryIdWorldwide, isAuthenticated, user?.CountryId, countries);

      //active and started (published state active)
      var searchResults = _programService.Search(new ProgramSearchFilterAdmin
      {
        Countries = countries,
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

      // Data integrity: default must always be world-wide (implicit null/empty or explicit Worldwide)
      var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
      if (!ProgramCountryPolicy.DefaultProgramIsWorldwide(countryIdWorldwide, result.Countries))
        throw new DataInconsistencyException($"Default program '{result.Name}' is not available world-wide");

      return result.ToInfo();
    }

    public ProgramInfo GetById(Guid id, bool includeChildItems, bool includeComputed)
    {
      var result = _programService.GetById(id, includeChildItems, includeComputed);

      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);

      // Anonymous: only allow active + started
      if (!isAuthenticated)
      {
        if (!Statuses_AnonymousAllowed.Contains(result.Status) || result.DateStart > DateTimeOffset.UtcNow)
          throw new EntityNotFoundException($"Program not found");
      }
      // Authenticated users: enforce country scope
      else
      {
        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;

        if (!ProgramCountryPolicy.ProgramAccessibleToUser(countryIdWorldwide, user?.CountryId, result.Countries))
          throw new EntityNotFoundException("Program not found");
      }

      return result.ToInfo();
    }

    public ProgramInfo GetByLinkId(Guid linkId, bool includeChildItems, bool includeComputed)
    {
      var result = _programService.GetByLinkId(linkId, includeChildItems, includeComputed);

      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);

      // Anonymous: only allow active + started
      if (!isAuthenticated)
      {
        if (!Statuses_AnonymousAllowed.Contains(result.Status) || result.DateStart > DateTimeOffset.UtcNow)
          throw new EntityNotFoundException($"Program not found");
      }
      // Authenticated: enforce country scope
      else
      {
        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;

        if (!ProgramCountryPolicy.ProgramAccessibleToUser(countryIdWorldwide, user?.CountryId, result.Countries))
          throw new EntityNotFoundException("Program not found");
      }

      return result.ToInfo();
    }

    public ProgramSearchResultsInfo Search(ProgramSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);
      var user = isAuthenticated ? _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false) : null;
      var countries = ProgramCountryPolicy.ResolveAvailableCountriesForProgramSearch(countryIdWorldwide, isAuthenticated, user?.CountryId, filter.Countries);

      var filterInternal = new ProgramSearchFilterAdmin
      {
        Countries = countries,
        // Anonymous users: only allow published state active (active + started), ignore input
        // Authenticated users: if none specified, default to published state active; else use provided list
        PublishedStates = !isAuthenticated || filter.PublishedStates == null || filter.PublishedStates.Count == 0
          ? [PublishedState.Active]
          : filter.PublishedStates,
        ValueContains = filter.ValueContains,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      };

      var searchResults = _programService.Search(filterInternal);

      var results = new ProgramSearchResultsInfo
      {
        TotalCount = searchResults.TotalCount,
        Items = searchResults.Items == null ? null : [.. searchResults.Items.Select(item => item.ToInfo())]
      };

      return results;
    }
    #endregion
  }
}

using FluentValidation;
using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Referral.Extensions;
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
      var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);
      var user = isAuthenticated ? _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false) : null;

      // Authenticated users (non-admin): auto-filter by user country (+ WW) when available
      if (isAuthenticated && !isAdmin && user?.CountryId.HasValue == true)
         countries = [user.CountryId.Value, countryIdWorldwide];
      // Otherwise: default to WW if no countries provided
      else if (countries == null || countries.Count == 0)
        countries = [countryIdWorldwide];

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
      if (result.Countries != null && result.Countries.Count != 0 && !result.Countries.Any(c => c.Id == countryIdWorldwide))
        throw new DataInconsistencyException(
          $"Default program '{result.Name}' is not available world-wide");

      return result.ToInfo();
    }

    public ProgramInfo GetById(Guid id, bool includeChildItems, bool includeComputed)
    {
      var result = _programService.GetById(id, includeChildItems, includeComputed);

      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);
      var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);

      // Anonymous: only allow active + started
      if (!isAuthenticated)
      {
        if (!Statuses_AnonymousAllowed.Contains(result.Status) || result.DateStart > DateTimeOffset.UtcNow)
          throw new EntityNotFoundException($"Program not found");
      }
      // Authenticated non-admin: enforce country scope
      else if (!isAdmin)
      {
        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        if (user?.CountryId.HasValue == true)
        {
          var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
          var programCountries = result.Countries;

          if (result.Countries != null && result.Countries.Count != 0 &&
            !result.Countries.Any(c => c.Id == user.CountryId.Value || c.Id == countryIdWorldwide))
            throw new EntityNotFoundException("Program not found");
        }
      }

      return result.ToInfo();
    }

    public ProgramInfo GetByLinkId(Guid linkId, bool includeChildItems, bool includeComputed)
    {
      var result = _programService.GetByLinkId(linkId, includeChildItems, includeComputed);

      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);
      var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);

      // Anonymous: only allow active + started
      if (!isAuthenticated)
      {
        if (!Statuses_AnonymousAllowed.Contains(result.Status) || result.DateStart > DateTimeOffset.UtcNow)
          throw new EntityNotFoundException($"Program not found");
      }
      // Authenticated non-admin: enforce country scope
      else if (!isAdmin)
      {
        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        if (user?.CountryId.HasValue == true)
        {
          var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
          var programCountries = result.Countries;

          if (result.Countries != null && result.Countries.Count != 0 &&
            !result.Countries.Any(c => c.Id == user.CountryId.Value || c.Id == countryIdWorldwide))
            throw new EntityNotFoundException("Program not found");
        }
      }

      return result.ToInfo();
    }

    public ProgramSearchResultsInfo Search(ProgramSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription()).Id;
      var isAuthenticated = HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor);
      var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);
      var user = isAuthenticated ? _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false) : null;

      var countries = filter.Countries?.Distinct().ToList();
      // Authenticated users (non-admin): auto-filter by user country (+ WW) when available
      if (isAuthenticated && !isAdmin && user?.CountryId.HasValue == true)
        countries = [user.CountryId.Value, countryIdWorldwide];
      // Otherwise: default to WW if no countries provided
      else if (countries == null || countries.Count == 0)
        countries = [countryIdWorldwide];

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
        Items = [.. searchResults.Items.Select(item => item.ToInfo())]
      };

      return results;
    }
    #endregion
  }
}

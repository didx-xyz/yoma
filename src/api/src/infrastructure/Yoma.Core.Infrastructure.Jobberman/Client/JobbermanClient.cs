using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman.Client
{
  public sealed class JobbermanClient : ISyncProviderClientPull<Domain.Opportunity.Models.Opportunity>
  {
    #region Class Variables
    private readonly ILogger<JobbermanClient> _logger;
    private readonly JobbermanOptions _options;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;

    private readonly SyncFilterPullValidator _syncFilterPullValidator;

    // Jobberman-specific job function to Yoma opportunity category mapping.
    // Keep in code for now because the mapping is small, partner-specific, and version-controlled.
    // Unknown or omitted values default to Other.
    private static readonly Dictionary<string, string> JobbermanCategoryMappings = new(StringComparer.OrdinalIgnoreCase)
    {
      { "Accounting, Auditing & Finance", "Business and Entrepreneurship" },
      { "Admin & Office", "Career and Personal Development" },
      { "Creative & Design", "Creative Industry and Arts" },
      { "Building & Architecture", "Business and Entrepreneurship" },
      { "Consulting & Strategy", "Business and Entrepreneurship" },
      { "Customer Service & Support", "Career and Personal Development" },
      { "Engineering & Technology", "Technology and Digitization" },
      { "Farming & Agriculture", "Agriculture" },
      { "Food Services & Catering", "Tourism and Hospitality" },
      { "Hospitality & Leisure", "Tourism and Hospitality" },
      { "Software & Data", "Technology and Digitization" },
      { "Legal Services", "Business and Entrepreneurship" },
      { "Marketing & Communications", "Creative Industry and Arts" },
      { "Medical & Pharmaceutical", "Health and Care" },
      { "Product & Project Management", "Business and Entrepreneurship" },
      { "Estate Agents & Property Management", "Business and Entrepreneurship" },
      { "Quality Control & Assurance", "Business and Entrepreneurship" },
      { "Human Resources", "Career and Personal Development" },
      { "Management & Business Development", "Business and Entrepreneurship" },
      { "Community & Social Services", "Career and Personal Development" },
      { "Sales", "Business and Entrepreneurship" },
      { "Supply Chain & Procurement", "Business and Entrepreneurship" },
      { "Research, Teaching & Training", "Career and Personal Development" },
      { "Trades & Services", "Business and Entrepreneurship" },
      { "Driver & Transport Services", "Business and Entrepreneurship" }
    };
    #endregion

    #region Constructor
    public JobbermanClient(
      ILogger<JobbermanClient> logger,
      IOptions<JobbermanOptions> options,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      IRepositoryBatched<Opportunity> opportunityRepository,
      SyncFilterPullValidator syncFilterPullValidator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _syncFilterPullValidator = syncFilterPullValidator ?? throw new ArgumentNullException(nameof(syncFilterPullValidator));
    }
    #endregion

    #region Public Members
    public Task<SyncResultPull<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPull filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _syncFilterPullValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Listing Jobberman opportunities for pull sync: PaginationEnabled={PaginationEnabled}, PageNumber={PageNumber}, PageSize={PageSize}",
          filter.PaginationEnabled, filter.PageNumber, filter.PageSize);

      var query = _opportunityRepository.Query();
      query = query.OrderBy(o => o.ExternalId);

      var result = new SyncResultPull<Domain.Opportunity.Models.Opportunity>();

      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query.ToList().Select(ToOpportunity)];

      return Task.FromResult(result);
    }
    #endregion

    #region Private Members
    private SyncItem<Domain.Opportunity.Models.Opportunity> ToOpportunity(Opportunity item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      var opportunityType = _opportunityTypeService.GetByName(Domain.Opportunity.Type.Job.ToString());

      var category = ResolveCategory(item.Category);
      var country = _countryService.GetByCodeAlpha2(item.CountryCodeAlpha2);
      var language = ResolveLanguage(item.Language);

      var feed = _options.Feeds.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, item.CountryCodeAlpha2, StringComparison.OrdinalIgnoreCase))
        ?? throw new InvalidOperationException($"Feed config for country '{item.CountryCodeAlpha2}': Not found");

      var orgId = feed.OrganizationIdYoma ?? _options.OrganizationIdYoma;
      if (!orgId.HasValue || orgId.Value == Guid.Empty)
        throw new InvalidOperationException($"Feed config for country '{item.CountryCodeAlpha2}': Yoma organization Id not configured");

      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Title = item.Title,
        Description = string.IsNullOrWhiteSpace(item.Description) ? item.Title : item.Description,
        TypeId = opportunityType.Id,
        Type = opportunityType.Name,
        OrganizationId = orgId.Value,
        Summary = item.Title,
        URL = item.URL,
        VerificationEnabled = false,
        Status = item.Deleted == true ? Status.Deleted : Status.Active,
        Keywords = BuildKeywords(item, category.Name),
        DateStart = item.DateStart ?? item.DateCreated,
        DateEnd = item.DateEnd,
        Featured = false,
        Hidden = false,
        Published = true,
        Categories = [category],
        Countries = [country],
        Languages = [language]
        // ExternalId: Opportunity.ExternalId is used by CSV imports; pull synchronization must set the external identifier on the SyncItem.
      };

      return new SyncItem<Domain.Opportunity.Models.Opportunity>
      {
        ExternalId = item.ExternalId,
        Deleted = item.Deleted == true,
        Item = opportunity
      };
    }

    private Domain.Lookups.Models.Language ResolveLanguage(string? nameSource)
    {
      var resultDefault = _languageService.GetByName(Domain.Core.Language.English.ToString());

      nameSource = nameSource?.NormalizeNullableValue();
      if (string.IsNullOrEmpty(nameSource)) return resultDefault;

      return _languageService.GetByNameOrNull(nameSource) ?? resultDefault;
    }

    private Domain.Opportunity.Models.Lookups.OpportunityCategory ResolveCategory(string? nameSource)
    {
      var resultDefault = _opportunityCategoryService.GetByName(Category.Other.ToString());

      nameSource = nameSource?.NormalizeNullableValue();
      if (string.IsNullOrEmpty(nameSource)) return resultDefault;

      var result = _opportunityCategoryService.GetByNameOrNull(nameSource);
      if (result is not null) return result;

      var mappedName = MapCategoryName(nameSource);
      if (string.IsNullOrEmpty(mappedName)) return resultDefault;

      return _opportunityCategoryService.GetByNameOrNull(mappedName) ?? resultDefault;
    }

    private static string? MapCategoryName(string nameSource)
    {
      var key = NormalizeLookupKey(nameSource);
      if (string.IsNullOrEmpty(key)) return null;

      return JobbermanCategoryMappings.TryGetValue(key, out var result) ? result : null;
    }

    private static string? NormalizeLookupKey(string? value)
    {
      value = value?.NormalizeNullableValue();
      if (string.IsNullOrEmpty(value)) return null;

      return value
        .RemoveSpecialCharacters()
        .NormalizeTrim()
        .ToUpperInvariant();
    }

    private static List<string>? BuildKeywords(Opportunity item, string category)
    {
      var results = new[]
      {
        Domain.Opportunity.Type.Job.ToString(),
        item.WorkType,
        category
      }
      .Where(o => !string.IsNullOrEmpty(o))
      .Select(o => o!.Trim())
      .Distinct(StringComparer.OrdinalIgnoreCase)
      .ToList();

      return results.Count == 0 ? null : results;
    }
    #endregion
  }
}

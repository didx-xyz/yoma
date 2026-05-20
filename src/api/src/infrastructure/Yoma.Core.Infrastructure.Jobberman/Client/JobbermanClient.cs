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
  public sealed class JobbermanClient : ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>
  {
    #region Class Variables
    private readonly ILogger<JobbermanClient> _logger;
    private readonly JobbermanOptions _options;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;

    private readonly SyncFilterPullEntityValidator _syncFilterPullEntityValidator;

    // Yoma category id -> Jobberman job functions.
    // Keep in code for now because the mapping is small, partner-specific, and version-controlled.
    // Unknown or omitted values default to Other.
    private static readonly Dictionary<Guid, string[]> JobbermanCategoryMappings = new()
    {
      // Business and Entrepreneurship
      { new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), ["Accounting, Auditing & Finance", "Building & Architecture", "Consulting & Strategy", "Legal Services", "Product & Project Management", "Estate Agents & Property Management", "Quality Control & Assurance", "Management & Business Development", "Sales", "Supply Chain & Procurement", "Trades & Services", "Driver & Transport Services"] },
      // Career and Personal Development
      { new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), ["Admin & Office", "Customer Service & Support", "Human Resources", "Community & Social Services", "Research, Teaching & Training"] },
      // Creative Industry and Arts
      { new Guid("7afb66ad-164e-46a3-933f-a0bac1ca1923"), ["Creative & Design", "Marketing & Communications"] },
      // Technology and Digitization
      { new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), ["Engineering & Technology", "Software & Data"] },
      // Agriculture
      { new Guid("2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950"), ["Farming & Agriculture"] },
      // Tourism and Hospitality
      { new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"), ["Food Services & Catering", "Hospitality & Leisure"] },
      // Health and Care
      { new Guid("6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71"), ["Medical & Pharmaceutical"] }
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
      SyncFilterPullEntityValidator syncFilterPullEntityValidator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _syncFilterPullEntityValidator = syncFilterPullEntityValidator ?? throw new ArgumentNullException(nameof(syncFilterPullEntityValidator));
    }
    #endregion

    #region Public Members
    public Task<SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPullEntity filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _syncFilterPullEntityValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Listing Jobberman opportunities for pull sync: PaginationEnabled={PaginationEnabled}, PageNumber={PageNumber}, PageSize={PageSize}",
          filter.PaginationEnabled, filter.PageNumber, filter.PageSize);

      var query = _opportunityRepository.Query();
      query = query.OrderBy(o => o.ExternalId);

      var result = new SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>();

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
    private SyncItemEntity<Domain.Opportunity.Models.Opportunity> ToOpportunity(Opportunity item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      var opportunityType = _opportunityTypeService.GetByName(Domain.Opportunity.Type.Job.ToString());

      var category = ResolveCategory(item.Category);
      var country = _countryService.GetByCodeAlpha2(item.CountryCodeAlpha2);
      var language = ResolveLanguage(item.Language);

      var title = item.Title.HtmlDecode()?.RemoveHtmlTags();
      if (string.IsNullOrWhiteSpace(title))
        throw new InvalidOperationException($"Jobberman opportunity title expected for external id '{item.ExternalId}'");

      var description = item.Description.HtmlToMarkdown() ?? title;
      var summary = title;

      var feed = _options.Feeds.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, item.CountryCodeAlpha2, StringComparison.OrdinalIgnoreCase))
        ?? throw new InvalidOperationException($"Feed config for country '{item.CountryCodeAlpha2}': Not found");

      var orgId = feed.OrganizationIdYoma ?? _options.OrganizationIdYoma;
      if (!orgId.HasValue || orgId.Value == Guid.Empty)
        throw new InvalidOperationException($"Feed config for country '{item.CountryCodeAlpha2}': Yoma organization Id not configured");

      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Title = title,
        Description = description,
        TypeId = opportunityType.Id,
        Type = opportunityType.Name,
        OrganizationId = orgId.Value,
        Summary = summary,
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

      return new SyncItemEntity<Domain.Opportunity.Models.Opportunity>
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

      return TryResolveJobbermanCategoryId(nameSource, out var categoryId)
        ? _opportunityCategoryService.GetById(categoryId)
        : resultDefault;
    }

    private static bool TryResolveJobbermanCategoryId(string nameSource, out Guid categoryId)
    {
      categoryId = default;

      var key = NormalizeLookupKey(nameSource);
      if (string.IsNullOrEmpty(key)) return false;

      foreach (var mapping in JobbermanCategoryMappings)
      {
        if (mapping.Value.Any(item => string.Equals(NormalizeLookupKey(item), key, StringComparison.OrdinalIgnoreCase)))
        {
          categoryId = mapping.Key;
          return true;
        }
      }

      return false;
    }

    private static string? NormalizeLookupKey(string? value)
    {
      value = value?.NormalizeNullableValue();
      if (string.IsNullOrEmpty(value)) return null;

      return value
        .RemoveSpecialCharacters()
        .NormalizeTrim();
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

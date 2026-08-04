using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.JobJack.Models;

namespace Yoma.Core.Infrastructure.JobJack.Client
{
  public sealed class JobJackClient : ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>
  {
    #region Class Variables
    private readonly ILogger<JobJackClient> _logger;
    private readonly JobJackOptions _options;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly SyncFilterPullEntityValidator _validator;

    // Yoma category id -> JobJack industry sectors.
    // Unknown or omitted values intentionally fall back to Other.
    private static readonly Dictionary<Guid, string[]> CategoryMappings = new()
    {
      // Technology and Digitization
      { new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), ["Analytics"] },
      // Business and Entrepreneurship
      { new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), ["Business Process Outsourcing", "Large industry manufacturing", "Other business service", "Professional Services", "Retail", "Transport & Logistics"] },
      // Career and Personal Development
      { new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), ["Personal services"] },
      // Tourism and Hospitality
      { new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"), ["Fast food", "Restaurant"] }
    };
    #endregion

    #region Constructor
    public JobJackClient(
      ILogger<JobJackClient> logger,
      IOptions<JobJackOptions> options,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      IRepositoryBatched<Opportunity> opportunityRepository,
      SyncFilterPullEntityValidator validator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }
    #endregion

    #region Public Members
    public Task<SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPullEntity filter)
    {
      ArgumentNullException.ThrowIfNull(filter);
      _validator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Listing JobJack opportunities for pull sync: PaginationEnabled={PaginationEnabled}, PageNumber={PageNumber}, PageSize={PageSize}", filter.PaginationEnabled, filter.PageNumber, filter.PageSize);

      IQueryable<Opportunity> query = _opportunityRepository.Query().OrderBy(o => o.ExternalId);
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
      var organizationId = _options.OrganizationIdYoma;
      if (!organizationId.HasValue || organizationId.Value == Guid.Empty)
        throw new InvalidOperationException("JobJack Yoma organization Id not configured");

      var type = _opportunityTypeService.GetByName(Domain.Opportunity.Type.Job.ToString());
      var category = ResolveCategory(item.Category);

      var summary = item.Title.HtmlDecode()?.RemoveHtmlTags();
      if (string.IsNullOrWhiteSpace(summary))
        throw new InvalidOperationException($"JobJack opportunity title expected for external id '{item.ExternalId}'");

      summary = summary.TitleCase(onlyWhenAllCaps: true);
      summary = summary.TrimToLengthWithEllipsis(OpportunityService.Summary_MaxLength);
      var title = BuildTitle(item, summary);

      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Title = title,
        Description = BuildDescription(item, summary),
        TypeId = type.Id,
        Type = type.Name,
        OrganizationId = organizationId.Value,
        Summary = summary,
        URL = item.URL,
        VerificationEnabled = false,
        Status = item.Deleted == true ? Status.Deleted : Status.Active,
        Keywords = BuildKeywords(item),
        DateStart = item.DateStart ?? item.DateCreated,
        DateEnd = item.DateEnd,
        Featured = false,
        Hidden = false,
        Published = true,
        Categories = [category],
        Countries = [_countryService.GetByCodeAlpha2(Domain.Core.Country.SouthAfrica.ToDescription())],
        Languages = [_languageService.GetByName(Domain.Core.Language.English.ToString())]
      };

      return new SyncItemEntity<Domain.Opportunity.Models.Opportunity>
      {
        ExternalId = item.ExternalId,
        Deleted = item.Deleted == true,
        Item = opportunity
      };
    }

    private Domain.Opportunity.Models.Lookups.OpportunityCategory ResolveCategory(string? source)
    {
      var resultDefault = _opportunityCategoryService.GetByName(Category.Other.ToString());
      var key = NormalizeLookupKey(source);
      if (key == null) return resultDefault;

      foreach (var mapping in CategoryMappings)
      {
        if (mapping.Value.Any(value => string.Equals(NormalizeLookupKey(value), key, StringComparison.OrdinalIgnoreCase)))
          return _opportunityCategoryService.GetById(mapping.Key);
      }

      return resultDefault;
    }

    private static string BuildDescription(Opportunity item, string title)
    {
      var description = item.Description.HtmlToMarkdown();
      if (string.IsNullOrWhiteSpace(description)) description = title;

      var metadata = new List<string>();
      var requirements = BuildRequirements(item.Requirements);
      if (!string.IsNullOrEmpty(requirements)) metadata.Add(requirements);

      AddDetail(metadata, "Location", item.Location);
      AddDetail(metadata, "Contract type", item.ContractType?.TitleCase());
      AddDetail(metadata, "Positions available", item.OpportunitiesAvailable?.ToString());
      AddDetail(metadata, "Salary", BuildSalary(item));
      AddDetail(metadata, "Employment start date", item.EmploymentStartDate?.ToString("dd MMM yyyy"));

      if (metadata.Count > 0)
        description = $"{description}{StringExtensions.MarkdownParagraphBreak}{string.Join("\n", metadata)}";

      return description.NormalizeTrimMultiline();
    }

    private static string? BuildRequirements(string? value)
    {
      var requirements = NormalizeRequirements(value);

      return requirements.Count switch
      {
        0 => null,
        1 => $"**Requirements:** {requirements[0]}",
        _ => $"**Requirements:**\n{string.Join("\n", requirements)}"
      };
    }

    private static List<string> NormalizeRequirements(string? value)
    {
      value = value.HtmlToMarkdown();
      if (string.IsNullOrWhiteSpace(value)) return [];

      value = value.Replace(StringExtensions.MarkdownParagraphBreak, "\n", StringComparison.Ordinal);
      var result = new List<string>();

      foreach (var sourceLine in value.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
      {
        var line = sourceLine.TrimStart('-', '*', ' ');
        if (string.IsNullOrWhiteSpace(line)) continue;

        var separatorIndex = line.IndexOf(':');
        if (separatorIndex < 0)
        {
          if (!System.Text.RegularExpressions.Regex.IsMatch(line, @"^(?:[\p{L}-]+\s+)*requirements?$", System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant))
            result.Add(line);
          continue;
        }

        var label = line[..separatorIndex];
        label = System.Text.RegularExpressions.Regex.Replace(label, @"\brequirements?\b", string.Empty, System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant);
        label = System.Text.RegularExpressions.Regex.Replace(label, @"\s{2,}", " ", System.Text.RegularExpressions.RegexOptions.CultureInvariant).Trim(' ', '-', ':');
        var detail = line[(separatorIndex + 1)..].Trim();
        if (string.IsNullOrEmpty(label) && string.IsNullOrEmpty(detail)) continue;

        result.Add(string.IsNullOrEmpty(label) ? detail : $"{label}: {detail}");
      }

      return result;
    }

    private static void AddDetail(List<string> sections, string label, string? value)
    {
      value = value?.NormalizeNullableValue();
      if (!string.IsNullOrEmpty(value)) sections.Add($"**{label}:** {value}");
    }

    private static string BuildTitle(Opportunity item, string title)
    {
      var company = item.Company.HtmlDecode()?.RemoveHtmlTags();
      var city = item.City.HtmlDecode()?.RemoveHtmlTags();
      var companyInTitle = !string.IsNullOrWhiteSpace(company) && title.Contains(company, StringComparison.OrdinalIgnoreCase);
      var cityInTitle = !string.IsNullOrWhiteSpace(city) && title.Contains(city, StringComparison.OrdinalIgnoreCase);

      if (!string.IsNullOrWhiteSpace(company) && !companyInTitle)
        title = cityInTitle ? $"{title} ({company})" : $"{title} - {company}";

      if (!string.IsNullOrWhiteSpace(city) && !cityInTitle)
        title = $"{title} ({city})";

      return title.TrimToLengthWithEllipsis(OpportunityService.Title_MaxLength);
    }

    private static string? BuildSalary(Opportunity item)
    {
      var parts = new List<string>();

      if (item.SalaryLow.HasValue && item.SalaryHigh.HasValue)
      {
        var range = item.SalaryLow == item.SalaryHigh
          ? item.SalaryLow.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)
          : $"{item.SalaryLow.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)} - {item.SalaryHigh.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)}";
        parts.Add(range);
      }
      else if (item.SalaryLow.HasValue)
      {
        parts.Add($"From {item.SalaryLow.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)}");
      }
      else if (item.SalaryHigh.HasValue)
      {
        parts.Add($"Up to {item.SalaryHigh.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)}");
      }

      if (!string.IsNullOrWhiteSpace(item.SalaryFrequency)) parts.Add(item.SalaryFrequency.TitleCase());
      if (!string.IsNullOrWhiteSpace(item.SalaryType)) parts.Add(item.SalaryType.TitleCase());
      if (!string.IsNullOrWhiteSpace(item.SalaryAdditional)) parts.Add(item.SalaryAdditional);

      return parts.Count == 0 ? null : string.Join(", ", parts.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static List<string> BuildKeywords(Opportunity item)
    {
      var result = new List<string>();

      foreach (var keyword in GetKeywordCandidates(item))
        AddKeyword(result, keyword);

      return result;
    }

    private static IEnumerable<string?> GetKeywordCandidates(Opportunity item)
    {
      yield return item.Company;
      yield return item.ContractType;

      foreach (var category in item.Category?.Split(
        OpportunityService.Keywords_Separator,
        StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [])
        yield return category;
    }

    private static void AddKeyword(List<string> keywords, string? value)
    {
      value = value?.Trim().HtmlDecode().RemoveHtmlTags();
      if (string.IsNullOrEmpty(value)) return;

      if (value.Contains(OpportunityService.Keywords_Separator, StringComparison.Ordinal))
        return;

      if (keywords.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase)))
        return;

      var currentLength = keywords.Count == 0
        ? 0
        : string.Join(OpportunityService.Keywords_Separator, keywords).Length;

      var projectedLength = currentLength + value.Length;
      if (keywords.Count > 0)
        projectedLength += OpportunityService.Keywords_Separator.Length;

      if (projectedLength > OpportunityService.Keywords_CombinedMaxLength)
        return;

      keywords.Add(value);
    }

    private static string? NormalizeLookupKey(string? value)
    {
      value = value?.NormalizeNullableValue();
      return string.IsNullOrEmpty(value) ? null : value.RemoveSpecialCharacters().NormalizeTrim();
    }
    #endregion
  }
}

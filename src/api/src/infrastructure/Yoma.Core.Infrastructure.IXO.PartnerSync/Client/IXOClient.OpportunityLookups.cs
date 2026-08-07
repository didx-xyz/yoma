using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;
using IXOOpportunity = Yoma.Core.Infrastructure.IXO.PartnerSync.Models.OpportunityResponse;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Client
{
  public sealed partial class IXOClient
  {
    #region Private Members
    private List<Domain.Opportunity.Models.Lookups.OpportunityCategory> GetCategories(IEnumerable<string>? source)
    {
      var result = (source ?? [])
        .Select(ResolveCategory)
        .Where(o => o != null)
        .Cast<Domain.Opportunity.Models.Lookups.OpportunityCategory>()
        .DistinctBy(o => o.Id)
        .ToList();

      return result.Count > 0
        ? result
        : [_opportunityCategoryService.GetByName(Category.Other.ToString())];
    }

    private Domain.Opportunity.Models.Lookups.OpportunityCategory? ResolveCategory(string? value)
    {
      var key = NormalizeLookupKey(value);
      if (string.IsNullOrEmpty(key)) return null;

      foreach (var mapping in CategoryMappings)
      {
        if (mapping.Value.Any(candidate =>
          string.Equals(NormalizeLookupKey(candidate), key, StringComparison.OrdinalIgnoreCase)))
          return _opportunityCategoryService.GetById(mapping.Key);
      }

      return null;
    }

    private List<Domain.Lookups.Models.Country> GetCountries(IEnumerable<string>? source)
    {
      var available = _countryService.List();
      var result = (source ?? [])
        .Select(value => ResolveCountry(value, available))
        .Where(o => o != null)
        .Cast<Domain.Lookups.Models.Country>()
        .DistinctBy(o => o.Id)
        .ToList();

      if (result.Count == 0)
        throw new InvalidOperationException("IXO opportunity must contain at least one supported country");

      return result;
    }

    private static Domain.Lookups.Models.Country? ResolveCountry(
      string? value,
      List<Domain.Lookups.Models.Country> available)
    {
      value = value?.Trim();
      if (string.IsNullOrEmpty(value)) return null;

      if (string.Equals(value, "Worldwide", StringComparison.OrdinalIgnoreCase))
        value = "WW";

      return available.SingleOrDefault(country =>
        string.Equals(country.CodeAlpha2, value, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(country.CodeAlpha3, value, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(country.CodeNumeric, value, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(country.Name, value, StringComparison.OrdinalIgnoreCase));
    }

    private List<Domain.Lookups.Models.Language> GetLanguages(IEnumerable<string>? source)
    {
      var result = (source ?? [])
        .Select(ResolveLanguage)
        .Where(o => o != null)
        .Cast<Domain.Lookups.Models.Language>()
        .DistinctBy(o => o.Id)
        .ToList();

      if (result.Count == 0)
        result.Add(_languageService.GetByName(Domain.Core.Language.English.ToString()));

      return result;
    }

    private Domain.Lookups.Models.Language? ResolveLanguage(string? value)
    {
      value = value?.Trim();
      return string.IsNullOrEmpty(value)
        ? null
        : _languageService.GetByCodeAlpha2OrNull(value);
    }

    private List<Domain.Lookups.Models.Skill>? GetSkills(IEnumerable<string>? source)
    {
      var result = (source ?? [])
        .Select(ResolveSkill)
        .Where(o => o != null)
        .Cast<Domain.Lookups.Models.Skill>()
        .DistinctBy(o => o.Id)
        .ToList();

      return result.Count == 0 ? null : result;
    }

    private Domain.Lookups.Models.Skill? ResolveSkill(string? value)
    {
      value = value?.Trim();
      return string.IsNullOrEmpty(value)
        ? null
        : _skillService.GetByNameNormalizedOrNull(value);
    }

    private Domain.Opportunity.Models.Lookups.OpportunityDifficulty ResolveDifficulty(string? value)
    {
      value = value?.Trim();

      if (string.IsNullOrEmpty(value))
        return _opportunityDifficultyService.GetByName(Difficulty.AnyLevel.ToDescription());

      return _opportunityDifficultyService.GetByNameOrNull(value)
        ?? throw new InvalidOperationException($"IXO learning difficulty '{value}' is not supported");
    }

    private (Domain.Lookups.Models.TimeInterval Interval, short Count) ResolveCommitment(Commitment? commitment)
    {
      if (commitment == null)
        return (_timeIntervalService.GetByName(TimeIntervalOption.Hour.ToString()), 1);

      var intervalName = commitment.Interval?.Trim();
      if (string.IsNullOrEmpty(intervalName))
        throw new InvalidOperationException("IXO commitment interval is required");

      var interval = _timeIntervalService.GetByNameOrNull(intervalName)
        ?? throw new InvalidOperationException($"IXO commitment interval '{intervalName}' is not supported");

      if (commitment.Count < 1 || commitment.Count > short.MaxValue)
        throw new InvalidOperationException($"IXO commitment count '{commitment.Count}' must be between 1 and {short.MaxValue}");

      return (interval, (short)commitment.Count);
    }

    private Domain.Lookups.Models.EngagementType ResolveEngagementType(string? value)
    {
      value = value?.Trim();
      if (string.IsNullOrEmpty(value))
        value = EngagementTypeOption.Online.ToString();

      return _engagementTypeService.GetByNameOrNull(value)
        ?? throw new InvalidOperationException($"IXO learning engagement type '{value}' is not supported");
    }

    private static List<string>? GetKeywords(IXOOpportunity item)
    {
      var result = new List<string>();

      foreach (var candidate in GetKeywordCandidates(item))
        AddKeyword(result, candidate);

      return result.Count == 0 ? null : result;
    }

    private static IEnumerable<string?> GetKeywordCandidates(IXOOpportunity item)
    {
      // Preserve IXO's explicit search terms and raw category terminology. Mapped Yoma categories,
      // skills, organization and opportunity type are already included by Yoma's central search.
      foreach (var keyword in item.Keywords ?? [])
        yield return keyword;

      foreach (var category in item.Categories ?? [])
      {
        foreach (var categoryName in category.Split(
          OpportunityService.Keywords_Separator,
          StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
          yield return categoryName;
      }

      yield return item.WorkType;
      yield return item.EngagementType;
    }
    private static void AddKeyword(List<string> keywords, string? value)
    {
      value = value?.Trim().HtmlDecode()?.RemoveHtmlTags();
      if (string.IsNullOrEmpty(value)) return;
      if (value.Contains(OpportunityService.Keywords_Separator, StringComparison.Ordinal)) return;
      if (keywords.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase))) return;

      var projected = value.Length;
      if (keywords.Count > 0)
      {
        projected += string.Join(OpportunityService.Keywords_Separator, keywords).Length +
          OpportunityService.Keywords_Separator.Length;
      }

      if (projected <= OpportunityService.Keywords_CombinedMaxLength)
        keywords.Add(value);
    }

    private static string? NormalizeLookupKey(string? value)
    {
      value = value?.NormalizeNullableValue();
      if (string.IsNullOrEmpty(value)) return null;

      return value.RemoveSpecialCharacters().NormalizeTrim();
    }
    #endregion
  }
}

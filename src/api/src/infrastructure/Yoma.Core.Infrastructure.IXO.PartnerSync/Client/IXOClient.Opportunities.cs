using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;
using IXOOpportunity = Yoma.Core.Infrastructure.IXO.PartnerSync.Models.OpportunityResponse;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Client
{
  public sealed partial class IXOClient
  {
    #region Private Members
    private SyncItemEntity<Domain.Opportunity.Models.Opportunity> ToSyncItem(Opportunity cacheItem)
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapping IXO opportunity '{opportunityExternalId}' from the local catalogue", cacheItem.ExternalId);

      if (string.IsNullOrWhiteSpace(cacheItem.PayloadJson))
        throw new InvalidOperationException($"IXO opportunity cache item '{cacheItem.ExternalId}' has no payload JSON");

      var item = JsonConvert.DeserializeObject<IXOOpportunity>(cacheItem.PayloadJson)
        ?? throw new InvalidOperationException($"Failed to deserialize IXO opportunity cache item '{cacheItem.ExternalId}'");

      var deleted = cacheItem.Deleted == true;
      var type = ParseOpportunityType(item.Type);

      var opportunityType = _opportunityTypeService.GetByName(type.ToString());

      var title = GetTitle(item);

      var summary = GetSummary(item, title);

      var description = item.Description.HtmlToMarkdown();

      if (string.IsNullOrWhiteSpace(description))
        description = summary;
      var categories = GetCategories(item.Categories);

      var countries = GetCountries(item.Countries);

      var languages = GetLanguages(item.Languages);

      var skills = GetSkills(item.Skills);

      var keywords = GetKeywords(item);

      var result = new Domain.Opportunity.Models.Opportunity
      {
        Title = title,
        Description = description,
        TypeId = opportunityType.Id,
        Type = opportunityType.Name,
        Summary = summary,
        URL = GetRequiredValue(item.URL, "url", item.ExternalId),
        OrganizationId = GetOrganizationId(),
        OrganizationName = _options.OrganizationName,
        DateStart = item.StartDate,
        DateEnd = item.EndDate,
        Status = deleted ? Status.Deleted : Status.Active,
        VerificationEnabled = true,
        VerificationMethod = VerificationMethod.Automatic,
        VerificationTypes = null,
        ParticipantLimit = null,
        ZltoReward = null,
        YomaReward = null,
        ZltoRewardPool = null,
        YomaRewardPool = null,
        CredentialIssuanceEnabled = true,
        SSISchemaName = SSISSchemaHelper.ToFullName(SchemaType.Opportunity, "Default"),
        Skills = skills,
        ShareWithPartners = false,
        Hidden = false,
        Featured = false,
        Published = true,
        Keywords = keywords,
        Categories = categories,
        Countries = countries,
        Languages = languages
      };

      if (type == Domain.Opportunity.Type.Learning)
      {
        var difficulty = ResolveDifficulty(item.Difficulty);
        var (Interval, Count) = ResolveCommitment(item.Commitment);
        var engagementType = ResolveEngagementType(item.EngagementType);

        result.DifficultyId = difficulty.Id;
        result.CommitmentIntervalId = Interval.Id;
        result.CommitmentIntervalCount = Count;
        result.EngagementTypeId = engagementType.Id;
      }

      return new SyncItemEntity<Domain.Opportunity.Models.Opportunity>
      {
        ExternalId = cacheItem.ExternalId,
        Deleted = deleted,
        Item = result
      };
    }

    private Guid GetOrganizationId()
    {
      if (_options.OrganizationIdYoma == Guid.Empty)
        throw new InvalidOperationException("IXO Yoma organization id is not configured");

      return _options.OrganizationIdYoma;
    }

    private static Domain.Opportunity.Type ParseOpportunityType(string? value)
    {
      value = value?.Trim();

      return Enum.TryParse<Domain.Opportunity.Type>(value, true, out var result) &&
        result is Domain.Opportunity.Type.Learning or Domain.Opportunity.Type.Job
          ? result
          : throw new InvalidOperationException($"IXO opportunity type '{value}' is not supported");
    }

    private static string GetTitle(IXOOpportunity item)
    {
      var title = item.Title.HtmlDecode()?.RemoveHtmlTags();

      if (string.IsNullOrWhiteSpace(title))
        throw new InvalidOperationException($"IXO opportunity title expected for external id '{item.ExternalId}'");

      return title.TrimToLengthWithEllipsis(OpportunityService.Title_MaxLength);
    }

    private static string GetSummary(IXOOpportunity item, string title)
    {
      var summary = item.Summary.HtmlDecode()?.RemoveHtmlTags();

      if (string.IsNullOrWhiteSpace(summary))
        summary = title;

      return summary.TrimToLengthWithEllipsis(OpportunityService.Summary_MaxLength);
    }

    private static string GetRequiredValue(string? value, string field, string externalId)
    {
      value = value?.Trim();

      return !string.IsNullOrEmpty(value)
        ? value
        : throw new InvalidOperationException($"IXO opportunity '{externalId}' field '{field}' is required");
    }
    #endregion
  }
}

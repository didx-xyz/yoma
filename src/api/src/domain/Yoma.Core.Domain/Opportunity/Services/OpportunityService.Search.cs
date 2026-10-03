using System.Linq.Expressions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Helpers;
using Yoma.Core.Domain.Opportunity.Helpers;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Services
{
  public partial class OpportunityService
  {
    #region Private Members
    private static void PrepareSearchSelection(OpportunitySearchSelection selection)
    {
      ParseOpportunitySearchFilterCommitmentInterval(selection);
      ParseOpportunitySearchFilterZltoReward(selection);
    }

    private void HydrateSearchSelection(OpportunitySearchSelection selection)
    {
      _customFieldValueService.ValidateAndHydrateFilters(CustomFieldEntityType.Opportunity, selection.CustomFields);
      if (selection.CustomFields == null) return;

      foreach (var clause in selection.CustomFields)
        clause.AppliesToTypeId = clause.EntityContext == null ? null :
          _opportunityTypeService.GetByName(clause.EntityContext).Id;
    }

    /// <summary>
    /// Apply only optional selections. The same path is used for root and branch
    /// queries; authorisation, visibility, dates and paging remain outer restrictions.
    /// </summary>
    private IQueryable<Models.Opportunity> ApplySearchSelection(
      IQueryable<Models.Opportunity> query,
      OpportunitySearchSelection selection)
    {
      // Provider.
      if (selection.Provider != null)
      {
        var match = selection.Provider.Value == null ? PredicateBuilder.False<Models.Opportunity>() :
          _opportunityRepository.Contains(o => o.Provider, selection.Provider.Value);
        query = query.Where(SearchCriterionHelper.Apply(match, o => o.Provider == null, selection.Provider.Unspecified));
      }

      // Incentives: a false selection remains an active comparison.
      if (selection.Incentivized != null)
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(
          o => o.Incentivized == selection.Incentivized.Value,
          o => !o.Incentivized.HasValue, selection.Incentivized.Unspecified, UnspecifiedMatch.Include));

      if (selection.RewardTypes?.Value != null)
        query = query.Where(o => selection.RewardTypes.Value.Contains(o.RewardType));

      // Accessibility support is independent; Other text stays within Other mappings.
      if (selection.AccessibilitySupport != null)
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(
          o => o.AccessibilitySupport == selection.AccessibilitySupport.Value,
          o => !o.AccessibilitySupport.HasValue, selection.AccessibilitySupport.Unspecified, UnspecifiedMatch.Include));

      if (selection.AccommodationOtherDescription != null)
      {
        var otherId = _accessibilityService.GetByName(AccessibilityOption.Other.ToString()).Id;
        var otherMappings = _opportunityAccommodationRepository.Query()
          .Where(o => o.AccommodationId == otherId).Select(o => o.OpportunityId);
        query = query.Where(o => otherMappings.Contains(o.Id));

        var match = selection.AccommodationOtherDescription.Value == null ? PredicateBuilder.False<Models.Opportunity>() :
          _opportunityRepository.Contains(o => o.AccommodationOtherDescription, selection.AccommodationOtherDescription.Value);
        query = query.Where(SearchCriterionHelper.Apply(match, o => o.AccommodationOtherDescription == null,
          selection.AccommodationOtherDescription.Unspecified));
      }

      if (selection.Accommodations != null)
      {
        var all = _opportunityAccommodationRepository.Query().Select(o => o.OpportunityId);
        var match = PredicateBuilder.True<Models.Opportunity>();
        if (selection.Accommodations.Value != null)
          foreach (var id in selection.Accommodations.Value)
          {
            var matching = _opportunityAccommodationRepository.Query()
              .Where(o => o.AccommodationId == id).Select(o => o.OpportunityId);
            match = match.And(o => matching.Contains(o.Id));
          }
        else match = PredicateBuilder.False<Models.Opportunity>();

        // Explicit No remains a non-match even if imported/legacy mappings contradict it.
        match = match.And(o => o.AccessibilitySupport != AccessibilitySupport.No);

        query = query.Where(SearchCriterionHelper.Apply(match,
          o => o.AccessibilitySupport != AccessibilitySupport.No && !all.Contains(o.Id),
          selection.Accommodations.Unspecified));
      }

      if (selection.TargetedGroups != null)
      {
        var all = _opportunityTargetedGroupRepository.Query().Select(o => o.OpportunityId);
        var matching = _opportunityTargetedGroupRepository.Query()
          .Where(o => selection.TargetedGroups.Value != null && selection.TargetedGroups.Value.Contains(o.TargetedGroupId))
          .Select(o => o.OpportunityId);
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(o => matching.Contains(o.Id),
          o => !all.Contains(o.Id), selection.TargetedGroups.Unspecified, UnspecifiedMatch.Include));
      }

      if (selection.SustainableDevelopmentGoals != null)
      {
        var all = _opportunitySustainableDevelopmentGoalRepository.Query().Select(o => o.OpportunityId);
        var matching = _opportunitySustainableDevelopmentGoalRepository.Query()
          .Where(o => selection.SustainableDevelopmentGoals.Value != null &&
            selection.SustainableDevelopmentGoals.Value.Contains(o.SustainableDevelopmentGoalId))
          .Select(o => o.OpportunityId);
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(o => matching.Contains(o.Id),
          o => !all.Contains(o.Id), selection.SustainableDevelopmentGoals.Unspecified, UnspecifiedMatch.Include));
      }

      // Open age bounds are unrestricted, not unknown eligibility.
      if (selection.Age.HasValue)
        query = query.Where(o => (!o.AgeFrom.HasValue || o.AgeFrom <= selection.Age) &&
          (!o.AgeTo.HasValue || o.AgeTo >= selection.Age));

      if (selection.Types?.Value != null)
        query = query.Where(o => selection.Types.Value.Contains(o.TypeId));

      if (selection.Categories != null)
      {
        var all = _opportunityCategoryRepository.Query().Select(o => o.OpportunityId);
        var matching = _opportunityCategoryRepository.Query()
          .Where(o => selection.Categories.Value != null && selection.Categories.Value.Contains(o.CategoryId))
          .Select(o => o.OpportunityId);
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(o => matching.Contains(o.Id),
          o => !all.Contains(o.Id), selection.Categories.Unspecified));
      }

      if (selection.Languages != null)
      {
        var all = _opportunityLanguageRepository.Query().Select(o => o.OpportunityId);
        var matching = _opportunityLanguageRepository.Query()
          .Where(o => selection.Languages.Value != null && selection.Languages.Value.Contains(o.LanguageId))
          .Select(o => o.OpportunityId);
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(o => matching.Contains(o.Id),
          o => !all.Contains(o.Id), selection.Languages.Unspecified));
      }

      // Location: OR countries, AND each country's optional details on one mapping.
      if (selection.Countries != null)
      {
        var predicate = PredicateBuilder.False<Models.Opportunity>();
        foreach (var country in selection.Countries)
        {
          var locations = _opportunityCountryRepository.Query().Where(o => o.CountryId == country.CountryId);
          if (country.Region != null)
          {
            var match = country.Region.Value == null ? PredicateBuilder.False<OpportunityCountry>() :
              _opportunityCountryRepository.Contains(o => o.Region, country.Region.Value);
            locations = locations.Where(SearchCriterionHelper.Apply(match, o => o.Region == null,
              country.Region.Unspecified, UnspecifiedMatch.Include));
          }

          if (country.City != null)
          {
            var match = country.City.Value == null ? PredicateBuilder.False<OpportunityCountry>() :
              _opportunityCountryRepository.Contains(o => o.City, country.City.Value);
            locations = locations.Where(SearchCriterionHelper.Apply(match, o => o.City == null,
              country.City.Unspecified, UnspecifiedMatch.Include));
          }

          if (country.Radius != null)
          {
            var matches = country.Radius.Value == null ? locations.Where(o => false) :
              _opportunityCountryRepository.WithinRadius(locations, country.Radius.Value.Coordinates, country.Radius.Value.RadiusKm);
            var ids = matches.Select(o => o.Id);
            locations = locations.Where(SearchCriterionHelper.Apply<OpportunityCountry>(
              o => ids.Contains(o.Id), o => !o.HasCoordinates, country.Radius.Unspecified));
          }

          predicate = predicate.Or(o => locations.Any(location => location.OpportunityId == o.Id));
        }
        query = query.Where(predicate);
      }

      if (selection.Organizations?.Value != null)
        query = query.Where(o => selection.Organizations.Value.Contains(o.OrganizationId));

      if (selection.EngagementTypes != null)
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(
          o => o.EngagementTypeId.HasValue && selection.EngagementTypes.Value != null &&
            selection.EngagementTypes.Value.Contains(o.EngagementTypeId.Value),
          o => !o.EngagementTypeId.HasValue, selection.EngagementTypes.Unspecified));

      if (selection.Skills != null)
      {
        var all = _opportunitySkillRepository.Query().Select(o => o.OpportunityId);
        var matching = _opportunitySkillRepository.Query()
          .Where(o => selection.Skills.Value != null && selection.Skills.Value.Contains(o.SkillId))
          .Select(o => o.OpportunityId);
        query = query.Where(SearchCriterionHelper.Apply<Models.Opportunity>(o => matching.Contains(o.Id),
          o => !all.Contains(o.Id), selection.Skills.Unspecified));
      }

      if (selection.CommitmentInterval != null)
      {
        var match = PredicateBuilder.False<Models.Opportunity>();
        var value = selection.CommitmentInterval.Value;
        if (value?.OptionsParsed != null)
          foreach (var option in value.OptionsParsed)
            match = match.Or(o => o.CommitmentIntervalId == option.Id && o.CommitmentIntervalCount == option.Count);

        if (value?.Interval != null)
        {
          var maximum = TimeIntervalHelper.ConvertToMinutes(_timeIntervalService.GetById(value.Interval.Id).Name, value.Interval.Count);
          var minute = _timeIntervalService.GetByName(TimeIntervalOption.Minute.ToString()).Id;
          var hour = _timeIntervalService.GetByName(TimeIntervalOption.Hour.ToString()).Id;
          var day = _timeIntervalService.GetByName(TimeIntervalOption.Day.ToString()).Id;
          var week = _timeIntervalService.GetByName(TimeIntervalOption.Week.ToString()).Id;
          var month = _timeIntervalService.GetByName(TimeIntervalOption.Month.ToString()).Id;

          match = o => o.CommitmentIntervalCount.HasValue &&
            ((o.CommitmentIntervalId == minute && o.CommitmentIntervalCount <= maximum) ||
             (o.CommitmentIntervalId == hour && (long)o.CommitmentIntervalCount * 60 <= maximum) ||
             (o.CommitmentIntervalId == day && (long)o.CommitmentIntervalCount * 60 * 24 <= maximum) ||
             (o.CommitmentIntervalId == week && (long)o.CommitmentIntervalCount * 60 * 24 * 7 <= maximum) ||
             (o.CommitmentIntervalId == month && (long)o.CommitmentIntervalCount * 60 * 24 * 30 <= maximum));
        }

        query = query.Where(SearchCriterionHelper.Apply(match,
          o => !o.CommitmentIntervalId.HasValue || !o.CommitmentIntervalCount.HasValue,
          selection.CommitmentInterval.Unspecified, value?.Interval == null ? UnspecifiedMatch.Exclude : UnspecifiedMatch.Include));
      }

      if (selection.ZltoReward != null &&
        (selection.ZltoReward.Value?.HasReward != false || selection.ZltoReward.Value.Ranges?.Count > 0))
      {
        var match = PredicateBuilder.False<Models.Opportunity>();
        var value = selection.ZltoReward.Value;
        if (value?.RangesParsed != null)
          foreach (var range in value.RangesParsed)
            match = match.Or(o => o.ZltoReward >= range.From && o.ZltoReward <= range.To);
        if (value?.HasReward == true) match = o => o.ZltoReward > 0;

        query = query.Where(SearchCriterionHelper.Apply(match,
          o => o.RewardType == RewardType.ZLTO && !o.ZltoReward.HasValue, selection.ZltoReward.Unspecified));
      }

      return _opportunityRepository.WhereCustomFields(query, selection.CustomFields);
    }

    private static void ApplySearchOrdering(OpportunitySearchFilterAdmin filter)
    {
      if (filter.Ordering != null)
      {
        filter.OrderInstructions = [];
        foreach (var instruction in filter.Ordering)
        {
          // Separate nullness precedence keeps nullable fields last in either direction.
          if (instruction.Field == OpportunitySearchOrderField.DateEnd)
            filter.OrderInstructions.Add(new() { OrderBy = o => !o.DateEnd.HasValue, SortOrder = FilterSortOrder.Ascending });
          if (instruction.Field == OpportunitySearchOrderField.ZltoReward)
            filter.OrderInstructions.Add(new() { OrderBy = o => !o.ZltoReward.HasValue, SortOrder = FilterSortOrder.Ascending });

          Expression<Func<Models.Opportunity, object>> property = instruction.Field switch
          {
            OpportunitySearchOrderField.DateCreated => o => o.DateCreated,
            OpportunitySearchOrderField.DateEnd => o => o.DateEnd!,
            OpportunitySearchOrderField.ZltoReward => o => o.ZltoReward!,
            _ => throw new NotSupportedException($"Sort field '{instruction.Field}' is not supported")
          };
          filter.OrderInstructions.Add(new() { OrderBy = property, SortOrder = instruction.Direction });
        }
        filter.OrderInstructions.Add(new() { OrderBy = o => o.Id, SortOrder = FilterSortOrder.Ascending });
      }

      if (filter.Incentivized?.Value.HasValue == true &&
        (filter.Incentivized.Unspecified ?? UnspecifiedMatch.Include) == UnspecifiedMatch.Include)
        filter.OrderInstructions?.Insert(0, new() { OrderBy = o => !o.Incentivized.HasValue, SortOrder = FilterSortOrder.Ascending });
    }

    private IQueryable<Models.Opportunity> ApplyPublishedStates(IQueryable<Models.Opportunity> query,
      List<PublishedState> states)
    {
      var activeId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var expiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
      return query.Where(OpportunityPublishedStateHelper.Predicate<Models.Opportunity>(states,
        o => o.StatusId, o => o.DateStart, o => o.DateEnd, activeId, expiredId, DateTimeOffset.UtcNow));
    }
    #endregion
  }
}

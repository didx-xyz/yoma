using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserPreferencesRepository : IRepository<Domain.Entity.Models.UserPreferences>
  {
    #region Class Variables
    private readonly ApplicationDbContext _context;
    #endregion

    #region Constructor
    public UserPreferencesRepository(ApplicationDbContext context)
    {
      _context = context ?? throw new ArgumentNullException(nameof(context));
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserPreferences> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Entity.Models.UserPreferences> Query()
    {
      return _context.UserPreferences.Select(entity => new Domain.Entity.Models.UserPreferences
      {
        UserId = entity.UserId,
        GoalId = entity.GoalId,
        Goal = entity.Goal == null ? null : entity.Goal.Name,
        CommitmentIntervalId = entity.CommitmentIntervalId,
        CommitmentInterval = entity.CommitmentInterval == null
          ? null
          : Enum.Parse<Domain.Core.TimeIntervalOption>(entity.CommitmentInterval.Name, true),
        CommitmentIntervalCount = entity.CommitmentIntervalCount,
        EngagementTypeId = entity.EngagementTypeId,
        EngagementType = entity.EngagementType == null
          ? null
          : Enum.Parse<Domain.Core.EngagementTypeOption>(entity.EngagementType.Name, true),
        Incentivized = entity.Incentivized,
        AccessibilityRequirementOtherDescription = entity.AccessibilityRequirementOtherDescription,
        Categories = entity.Categories == null
          ? new List<Domain.Opportunity.Models.Lookups.OpportunityCategory>()
          : entity.Categories.Select(item => new Domain.Opportunity.Models.Lookups.OpportunityCategory
          {
            Id = item.CategoryId,
            Name = item.Category.Name,
            ImageURL = item.Category.ImageURL
          })
          .OrderBy(item => item.Name == Domain.Opportunity.Category.Other.ToString())
          .ThenBy(item => item.Name)
          .ToList(),
        AccessibilityRequirements = entity.AccessibilityRequirements == null
          ? new List<Domain.Lookups.Models.Accessibility>()
          : entity.AccessibilityRequirements.Select(item => new Domain.Lookups.Models.Accessibility
          {
            Id = item.AccessibilityId,
            Name = item.Accessibility.Name
          })
          .OrderBy(item => item.Name == AccessibilityOption.Other.ToString())
          .ThenBy(item => item.Name)
          .ToList(),
        Languages = entity.Languages == null
          ? new List<Domain.Lookups.Models.Language>()
          : entity.Languages.Select(item => new Domain.Lookups.Models.Language
          {
            Id = item.LanguageId,
            Name = item.Language.Name,
            CodeAlpha2 = item.Language.CodeAlpha2
          })
          .OrderBy(item => item.Name)
          .ToList()
      }).AsSplitQuery();
    }

    public async Task<Domain.Entity.Models.UserPreferences> Create(Domain.Entity.Models.UserPreferences item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      var now = DateTimeOffset.UtcNow;

      _context.UserPreferences.Add(new Entities.UserPreferences
      {
        UserId = item.UserId,
        GoalId = item.GoalId,
        CommitmentIntervalId = item.CommitmentIntervalId,
        CommitmentIntervalCount = item.CommitmentIntervalCount,
        EngagementTypeId = item.EngagementTypeId,
        Incentivized = item.Incentivized,
        AccessibilityRequirementOtherDescription = item.AccessibilityRequirementOtherDescription,
        DateCreated = now,
        DateModified = now
      });

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<Domain.Entity.Models.UserPreferences> Update(Domain.Entity.Models.UserPreferences item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      var entity = _context.UserPreferences.SingleOrDefault(value => value.UserId == item.UserId)
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"Preferences for user '{item.UserId}' do not exist");

      entity.GoalId = item.GoalId;
      entity.CommitmentIntervalId = item.CommitmentIntervalId;
      entity.CommitmentIntervalCount = item.CommitmentIntervalCount;
      entity.EngagementTypeId = item.EngagementTypeId;
      entity.Incentivized = item.Incentivized;
      entity.AccessibilityRequirementOtherDescription = item.AccessibilityRequirementOtherDescription;
      entity.DateModified = DateTimeOffset.UtcNow;

      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(Domain.Entity.Models.UserPreferences item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}

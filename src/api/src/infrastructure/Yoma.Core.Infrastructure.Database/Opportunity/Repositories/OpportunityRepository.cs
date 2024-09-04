using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunityRepository : BaseRepository<Entities.Opportunity, Guid>, IRepositoryBatchedValueContainsWithNavigation<Domain.Opportunity.Models.Opportunity>
  {
    #region Constructor
    public OpportunityRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Opportunity.Models.Opportunity> Query()
    {
      return Query(false);
    }

    public IQueryable<Domain.Opportunity.Models.Opportunity> Query(bool includeChildItems)
    {
      return _context.Opportunity.Select(entity => new Domain.Opportunity.Models.Opportunity()
      {
        Id = entity.Id,
        Title = entity.Title,
        Description = entity.Description,
        TypeId = entity.TypeId,
        Type = entity.Type.Name,
        OrganizationId = entity.OrganizationId,
        OrganizationName = entity.Organization.Name,
        OrganizationLogoId = entity.Organization.LogoId,
        OrganizationLogoStorageType = entity.Organization.Logo == null ? null : Enum.Parse<StorageType>(entity.Organization.Logo.StorageType, true),
        OrganizationLogoKey = entity.Organization.Logo == null ? null : entity.Organization.Logo.Key,
        OrganizationStatusId = entity.Organization.StatusId,
        OrganizationStatus = Enum.Parse<OrganizationStatus>(entity.Organization.Status.Name, true),
        Summary = entity.Summary,
        Instructions = entity.Instructions,
        URL = entity.URL,
        ZltoReward = entity.ZltoReward,
        YomaReward = entity.YomaReward,
        ZltoRewardPool = entity.ZltoRewardPool,
        YomaRewardPool = entity.YomaRewardPool,
        ZltoRewardCumulative = entity.ZltoRewardCumulative,
        YomaRewardCumulative = entity.YomaRewardCumulative,
        VerificationEnabled = entity.VerificationEnabled,
        VerificationMethodValue = entity.VerificationMethod,
        VerificationMethod = string.IsNullOrEmpty(entity.VerificationMethod) ? null : Enum.Parse<VerificationMethod>(entity.VerificationMethod, true),
        DifficultyId = entity.DifficultyId,
        Difficulty = entity.Difficulty.Name,
        CommitmentIntervalId = entity.CommitmentIntervalId,
        CommitmentInterval = Enum.Parse<TimeIntervalOption>(entity.CommitmentInterval.Name, true),
        CommitmentIntervalCount = entity.CommitmentIntervalCount,
        CommitmentIntervalDescription = $"{entity.CommitmentIntervalCount} {entity.CommitmentInterval.Name}{(entity.CommitmentIntervalCount > 1 ? "s" : string.Empty)}",
        ParticipantLimit = entity.ParticipantLimit,
        ParticipantCount = entity.ParticipantCount,
        StatusId = entity.StatusId,
        Status = Enum.Parse<Status>(entity.Status.Name, true),
        KeywordsFlatten = entity.Keywords,
        Keywords = string.IsNullOrEmpty(entity.Keywords) ? null : entity.Keywords.Split(OpportunityService.Keywords_Separator, StringSplitOptions.None).ToList(),
        DateStart = entity.DateStart,
        DateEnd = entity.DateEnd,
        CredentialIssuanceEnabled = entity.CredentialIssuanceEnabled,
        SSISchemaName = entity.SSISchemaName,
        Featured = entity.Featured,
        EngagementTypeId = entity.EngagementTypeId,
        EngagementType = entity.EngagementType == null ? null : Enum.Parse<EngagementTypeOption>(entity.EngagementType.Name, true),
        ShareWithPartners = entity.ShareWithPartners,
        DateCreated = entity.DateCreated,
        CreatedByUserId = entity.CreatedByUserId,
        DateModified = entity.DateModified,
        ModifiedByUserId = entity.ModifiedByUserId,
        Categories = includeChildItems ?
              entity.Categories.Select(o => new Domain.Opportunity.Models.Lookups.OpportunityCategory
              {
                Id = o.CategoryId,
                Name = o.Category.Name,
                ImageURL =
                  o.Category.ImageURL
              }).OrderBy(o => o.Name).ToList() : null,
        Countries = includeChildItems ?
              entity.Countries.Select(o => new Domain.Lookups.Models.Country
              {
                Id = o.CountryId,
                Name = o.Country.Name,
                CodeAlpha2 = o.Country.CodeAlpha2,
                CodeAlpha3 = o.Country.CodeAlpha3,
                CodeNumeric = o.Country.CodeNumeric
              }).OrderBy(o => o.Name).ToList() : null,
        Languages = includeChildItems ?
              entity.Languages.Select(o => new Domain.Lookups.Models.Language
              {
                Id = o.LanguageId,
                Name = o.Language.Name,
                CodeAlpha2 =
                  o.Language.CodeAlpha2
              }).OrderBy(o => o.Name).ToList() : null,
        Skills = entity.Skills == null ? null : includeChildItems ?
              entity.Skills.Select(o => new Domain.Lookups.Models.Skill
              {
                Id = o.SkillId,
                Name = o.Skill.Name,
                InfoURL =
                  o.Skill.InfoURL
              }).OrderBy(o => o.Name).ToList() : null,
        VerificationTypes = entity.VerificationTypes == null ? null : includeChildItems ?
              entity.VerificationTypes.Select(o => new Domain.Opportunity.Models.Lookups.OpportunityVerificationType
              {
                Id = o.VerificationTypeId,
                Type = Enum.Parse<VerificationType>(o.VerificationType.Name, true),
                DisplayName = o.VerificationType.DisplayName,
                Description = o.Description ?? o.VerificationType.Description
              }).OrderBy(o => o.DisplayName).ToList() : null,
      }).AsSplitQuery();
    }

    public Expression<Func<Domain.Opportunity.Models.Opportunity, bool>> Contains(Expression<Func<Domain.Opportunity.Models.Opportunity, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => EF.Functions.ILike(o.Title, $"%{value}%")
          || (!string.IsNullOrEmpty(o.Summary) && EF.Functions.ILike(o.Summary, $"%{value}%"))
          || (!string.IsNullOrEmpty(o.KeywordsFlatten) && EF.Functions.ILike(o.KeywordsFlatten, $"%{value}%"))
          || EF.Functions.ToTsVector("english", o.Description).Matches(value));
    }

    public IQueryable<Domain.Opportunity.Models.Opportunity> Contains(IQueryable<Domain.Opportunity.Models.Opportunity> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => EF.Functions.ILike(o.Title, $"%{value}%")
          || (!string.IsNullOrEmpty(o.Summary) && EF.Functions.ILike(o.Summary, $"%{value}%"))
          || (!string.IsNullOrEmpty(o.KeywordsFlatten) && EF.Functions.ILike(o.KeywordsFlatten, $"%{value}%"))
          || EF.Functions.ToTsVector("english", o.Description).Matches(value));
    }

    public async Task<Domain.Opportunity.Models.Opportunity> Create(Domain.Opportunity.Models.Opportunity item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Opportunity
      {
        Id = item.Id,
        Title = item.Title,
        Description = item.Description,
        TypeId = item.TypeId,
        OrganizationId = item.OrganizationId,
        Summary = item.Summary,
        Instructions = item.Instructions,
        URL = item.URL,
        ZltoReward = item.ZltoReward,
        YomaReward = item.YomaReward,
        ZltoRewardPool = item.ZltoRewardPool,
        YomaRewardPool = item.YomaRewardPool,
        VerificationEnabled = item.VerificationEnabled,
        VerificationMethod = item.VerificationMethod?.ToString(),
        DifficultyId = item.DifficultyId,
        CommitmentIntervalId = item.CommitmentIntervalId,
        CommitmentIntervalCount = item.CommitmentIntervalCount,
        ParticipantLimit = item.ParticipantLimit,
        ParticipantCount = item.ParticipantCount,
        StatusId = item.StatusId,
        Keywords = item.KeywordsFlatten,
        DateStart = item.DateStart,
        DateEnd = item.DateEnd,
        CredentialIssuanceEnabled = item.CredentialIssuanceEnabled,
        SSISchemaName = item.SSISchemaName,
        Featured = item.Featured,
        EngagementTypeId = item.EngagementTypeId,
        ShareWithPartners = item.ShareWithPartners,
        DateCreated = item.DateCreated,
        CreatedByUserId = item.CreatedByUserId,
        DateModified = item.DateModified,
        ModifiedByUserId = item.ModifiedByUserId,
      };

      _context.Opportunity.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<Domain.Opportunity.Models.Opportunity>> Create(List<Domain.Opportunity.Models.Opportunity> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
        new Entities.Opportunity
        {
          Id = item.Id,
          Title = item.Title,
          Description = item.Description,
          TypeId = item.TypeId,
          OrganizationId = item.OrganizationId,
          Summary = item.Summary,
          Instructions = item.Instructions,
          URL = item.URL,
          ZltoReward = item.ZltoReward,
          YomaReward = item.YomaReward,
          ZltoRewardPool = item.ZltoRewardPool,
          YomaRewardPool = item.YomaRewardPool,
          ZltoRewardCumulative = item.ZltoRewardCumulative,
          YomaRewardCumulative = item.YomaRewardCumulative,
          VerificationEnabled = item.VerificationEnabled,
          VerificationMethod = item.VerificationMethod?.ToString(),
          DifficultyId = item.DifficultyId,
          CommitmentIntervalId = item.CommitmentIntervalId,
          CommitmentIntervalCount = item.CommitmentIntervalCount,
          ParticipantLimit = item.ParticipantLimit,
          ParticipantCount = item.ParticipantCount,
          StatusId = item.StatusId,
          Keywords = item.KeywordsFlatten,
          DateStart = item.DateStart,
          DateEnd = item.DateEnd,
          CredentialIssuanceEnabled = item.CredentialIssuanceEnabled,
          SSISchemaName = item.SSISchemaName,
          Featured = item.Featured,
          EngagementTypeId = item.EngagementTypeId,
          ShareWithPartners = item.ShareWithPartners,
          DateCreated = DateTimeOffset.UtcNow,
          CreatedByUserId = item.CreatedByUserId,
          DateModified = DateTimeOffset.UtcNow,
          ModifiedByUserId = item.ModifiedByUserId
        });

      _context.Opportunity.AddRange(entities);
      await _context.SaveChangesAsync();

      items = items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      }).ToList();

      return items;
    }

    public async Task<Domain.Opportunity.Models.Opportunity> Update(Domain.Opportunity.Models.Opportunity item)
    {
      var entity = _context.Opportunity.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Opportunity)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Title = item.Title;
      entity.Description = item.Description;
      entity.TypeId = item.TypeId;
      entity.OrganizationId = item.OrganizationId;
      entity.Summary = item.Summary;
      entity.Instructions = item.Instructions;
      entity.URL = item.URL;
      entity.ZltoReward = item.ZltoReward;
      entity.YomaReward = item.YomaReward;
      entity.ZltoRewardPool = item.ZltoRewardPool;
      entity.YomaRewardPool = item.YomaRewardPool;
      entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
      entity.YomaRewardCumulative = item.YomaRewardCumulative;
      entity.VerificationEnabled = item.VerificationEnabled;
      entity.VerificationMethod = item.VerificationMethod?.ToString();
      entity.DifficultyId = item.DifficultyId;
      entity.CommitmentIntervalId = item.CommitmentIntervalId;
      entity.CommitmentIntervalCount = item.CommitmentIntervalCount;
      entity.ParticipantLimit = item.ParticipantLimit;
      entity.ParticipantCount = item.ParticipantCount;
      entity.StatusId = item.StatusId;
      entity.Keywords = item.KeywordsFlatten;
      entity.DateStart = item.DateStart;
      entity.DateEnd = item.DateEnd;
      entity.CredentialIssuanceEnabled = item.CredentialIssuanceEnabled;
      entity.SSISchemaName = item.SSISchemaName;
      entity.Featured = item.Featured;
      entity.EngagementTypeId = item.EngagementTypeId;
      entity.ShareWithPartners = item.ShareWithPartners;
      entity.DateModified = item.DateModified;
      entity.ModifiedByUserId = item.ModifiedByUserId;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<Domain.Opportunity.Models.Opportunity>> Update(List<Domain.Opportunity.Models.Opportunity> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.Opportunity.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.Opportunity)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.Title = item.Title;
        entity.Description = item.Description;
        entity.TypeId = item.TypeId;
        entity.OrganizationId = item.OrganizationId;
        entity.Summary = item.Summary;
        entity.Instructions = item.Instructions;
        entity.URL = item.URL;
        entity.ZltoReward = item.ZltoReward;
        entity.YomaReward = item.YomaReward;
        entity.ZltoRewardPool = item.ZltoRewardPool;
        entity.YomaRewardPool = item.YomaRewardPool;
        entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
        entity.YomaRewardCumulative = item.YomaRewardCumulative;
        entity.VerificationEnabled = item.VerificationEnabled;
        entity.VerificationMethod = item.VerificationMethod?.ToString();
        entity.DifficultyId = item.DifficultyId;
        entity.CommitmentIntervalId = item.CommitmentIntervalId;
        entity.CommitmentIntervalCount = item.CommitmentIntervalCount;
        entity.ParticipantLimit = item.ParticipantLimit;
        entity.ParticipantCount = item.ParticipantCount;
        entity.StatusId = item.StatusId;
        entity.Keywords = item.KeywordsFlatten;
        entity.DateStart = item.DateStart;
        entity.DateEnd = item.DateEnd;
        entity.CredentialIssuanceEnabled = item.CredentialIssuanceEnabled;
        entity.SSISchemaName = item.SSISchemaName;
        entity.Featured = item.Featured;
        entity.EngagementTypeId = item.EngagementTypeId;
        entity.ShareWithPartners = item.ShareWithPartners;
        entity.DateModified = item.DateModified;
        entity.ModifiedByUserId = item.ModifiedByUserId;
      }

      _context.Opportunity.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(Domain.Opportunity.Models.Opportunity item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}

using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Marketplace;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Repositories
{
  public class StoreAccessControlRuleRepository : BaseRepository<Entities.StoreAccessControlRule, Guid>, IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule>
  {
    #region Constructor
    public StoreAccessControlRuleRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<StoreAccessControlRule> Query()
    {
      return Query(false);
    }

    public IQueryable<StoreAccessControlRule> Query(bool includeChildItems)
    {
      return _context.StoreAccessControlRule.Select(entity => new StoreAccessControlRule
      {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description,
        OrganizationId = entity.OrganizationId,
        OrganizationName = entity.Organization.Name,
        StoreCountryId = entity.StoreCountryId,
        StoreCountryName = entity.StoreCountry.Name,
        StoreCountryCodeAlpha2 = entity.StoreCountry.CodeAlpha2,
        StoreId = entity.StoreId,
        StoreItemCategoriesRaw = entity.StoreItemCategories,
        StoreItemCategories = string.IsNullOrEmpty(entity.StoreItemCategories) ? null : JsonConvert.DeserializeObject<List<string>>(entity.StoreItemCategories),
        AgeFrom = entity.AgeFrom,
        AgeTo = entity.AgeTo,
        GenderId = entity.GenderId,
        Gender = entity.Gender == null ? null : entity.Gender.Name,
        OpportunityOption = string.IsNullOrEmpty(entity.OpportunityOption) ? null : Enum.Parse<StoreAccessControlRuleOpportunityCondition>(entity.OpportunityOption, true),
        StatusId = entity.StatusId,
        Status = Enum.Parse<StoreAccessControlRuleStatus>(entity.Status.Name, true),
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        Opportunities = entity.Opportunities == null ? null : includeChildItems ?
              entity.Opportunities.Select(o => new OpportunityItem
              {
                Id = o.OpportunityId,
                Title = o.Opportunity.Title
              }).OrderBy(o => o.Title).ToList() : null,
      });
    }

    public Expression<Func<StoreAccessControlRule, bool>> Contains(Expression<Func<StoreAccessControlRule, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => EF.Functions.ILike(o.Name, $"%{value}%"));
    }

    public IQueryable<StoreAccessControlRule> Contains(IQueryable<StoreAccessControlRule> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => EF.Functions.ILike(o.Name, $"%{value}%"));
    }

    public async Task<StoreAccessControlRule> Create(StoreAccessControlRule item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.StoreAccessControlRule
      {
        Name = item.Name,
        Description = item.Description,
        OrganizationId = item.OrganizationId,
        StoreCountryId = item.StoreCountryId,
        StoreId = item.StoreId,
        StoreItemCategories = item.StoreItemCategoriesRaw,
        AgeFrom = item.AgeFrom,
        AgeTo = item.AgeTo,
        GenderId = item.GenderId,
        OpportunityOption = item.OpportunityOption?.ToString(),
        StatusId = item.StatusId,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.StoreAccessControlRule.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<StoreAccessControlRule>> Create(List<StoreAccessControlRule> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
      new Entities.StoreAccessControlRule
      {
        Name = item.Name,
        Description = item.Description,
        OrganizationId = item.OrganizationId,
        StoreCountryId = item.StoreCountryId,
        StoreId = item.StoreId,
        StoreItemCategories = item.StoreItemCategoriesRaw,
        AgeFrom = item.AgeFrom,
        AgeTo = item.AgeTo,
        GenderId = item.GenderId,
        OpportunityOption = item.OpportunityOption?.ToString(),
        StatusId = item.StatusId,
        DateCreated = DateTimeOffset.UtcNow,
        DateModified = DateTimeOffset.UtcNow
      });

      _context.StoreAccessControlRule.AddRange(entities);
      await _context.SaveChangesAsync();

      items = [.. items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      })];

      return items;
    }

    public async Task<StoreAccessControlRule> Update(StoreAccessControlRule item)
    {
      var entity = _context.StoreAccessControlRule.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.StoreAccessControlRule)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Name = item.Name;
      entity.Description = item.Description;
      entity.OrganizationId = item.OrganizationId;
      entity.StoreCountryId = item.StoreCountryId;
      entity.StoreId = item.StoreId;
      entity.StoreItemCategories = item.StoreItemCategoriesRaw;
      entity.AgeFrom = item.AgeFrom;
      entity.AgeTo = item.AgeTo;
      entity.GenderId = item.GenderId;
      entity.OpportunityOption = item.OpportunityOption?.ToString();
      entity.StatusId = item.StatusId;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<StoreAccessControlRule>> Update(List<StoreAccessControlRule> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.StoreAccessControlRule.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(StoreAccessControlRule)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.Name = item.Name;
        entity.Description = item.Description;
        entity.OrganizationId = item.OrganizationId;
        entity.StoreCountryId = item.StoreCountryId;
        entity.StoreId = item.StoreId;
        entity.StoreItemCategories = item.StoreItemCategoriesRaw;
        entity.AgeFrom = item.AgeFrom;
        entity.AgeTo = item.AgeTo;
        entity.GenderId = item.GenderId;
        entity.OpportunityOption = item.OpportunityOption?.ToString();
        entity.StatusId = item.StatusId;
        entity.DateModified = item.DateModified;
      }

      _context.StoreAccessControlRule.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(StoreAccessControlRule item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}

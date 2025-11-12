using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class LinkUsageRepository : BaseRepository<Entities.LinkUsage, Guid>, IRepositoryBatched<ReferralLinkUsage>
  {
    #region Constructor
    public LinkUsageRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ReferralLinkUsage> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<ReferralLinkUsage> Query()
    {
      return _context.ReferralLinkUsage.Select(entity => new ReferralLinkUsage
      {
        Id = entity.Id,
        ProgramId = entity.ProgramId,
        ProgramName = entity.Program.Name,
        ProgramDescription = entity.Program.Description,
        ProgramCompletionWindowInDays = entity.Program.CompletionWindowInDays,
        LinkId = entity.LinkId,
        LinkName = entity.Link.Name,
        UserIdReferrer = entity.Link.UserId,
        UserDisplayNameReferrer = entity.Link.User.DisplayName,
        UserEmailReferrer = entity.Link.User.Email,
        UserPhoneNumberReferrer = entity.Link.User.PhoneNumber,
        UserId = entity.UserId,
        UserDisplayName = entity.User.DisplayName,
        UserEmail = entity.User.Email,
        UserPhoneNumber = entity.User.PhoneNumber,
        StatusId = entity.StatusId,
        Status = Enum.Parse<Domain.Referral.ReferralLinkUsageStatus>(entity.Status.Name, true),
        DateClaimed = entity.DateCreated,
        ZltoRewardReferee = entity.ZltoRewardReferee,
        ZltoRewardReferrer = entity.ZltoRewardReferrer,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<ReferralLinkUsage> Create(ReferralLinkUsage item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.LinkUsage
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        LinkId = item.LinkId,
        UserId = item.UserId,
        StatusId = item.StatusId,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.ReferralLinkUsage.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<ReferralLinkUsage>> Create(List<ReferralLinkUsage> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
        new Entities.LinkUsage
        {
          Id = item.Id,
          ProgramId = item.ProgramId,
          LinkId = item.LinkId,
          UserId = item.UserId,
          StatusId = item.StatusId,
          DateCreated = DateTimeOffset.UtcNow,
          DateModified = DateTimeOffset.UtcNow
        });

      _context.ReferralLinkUsage.AddRange(entities);
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

    public async Task<ReferralLinkUsage> Update(ReferralLinkUsage item)
    {
      var entity = _context.ReferralLinkUsage.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.LinkUsage)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.StatusId = item.StatusId;
      entity.ZltoRewardReferrer = item.ZltoRewardReferrer;
      entity.ZltoRewardReferee = item.ZltoRewardReferee;  
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<ReferralLinkUsage>> Update(List<ReferralLinkUsage> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.ReferralLinkUsage.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.LinkUsage)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.StatusId = item.StatusId;
        entity.ZltoRewardReferrer = item.ZltoRewardReferrer;
        entity.ZltoRewardReferee = item.ZltoRewardReferee;  
        entity.DateModified = item.DateModified;
      }

      _context.ReferralLinkUsage.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(ReferralLinkUsage item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(List<ReferralLinkUsage> items)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}

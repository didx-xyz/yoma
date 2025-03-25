using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Entities;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories
{
  public class MyOpportunityVerificationRepository : BaseRepository<MyOpportunityVerification, Guid>, IRepository<Domain.MyOpportunity.Models.MyOpportunityVerification>
  {
    #region Constructor
    public MyOpportunityVerificationRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.MyOpportunity.Models.MyOpportunityVerification> Query()
    {
      return _context.MyOpportunityVerifications.Select(entity => new Domain.MyOpportunity.Models.MyOpportunityVerification
      {
        Id = entity.Id,
        MyOpportunityId = entity.MyOpportunityId,
        UserDisplayName = entity.MyOpportunity.User.DisplayName ?? entity.MyOpportunity.User.Email ?? entity.MyOpportunity.User.PhoneNumber ?? string.Empty,
        VerificationTypeId = entity.VerificationTypeId,
        VerificationType = Enum.Parse<VerificationType>(entity.VerificationType.Name, true),
        GeometryProperties = entity.GeometryProperties,
        FileId = entity.FileId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.MyOpportunity.Models.MyOpportunityVerification> Create(Domain.MyOpportunity.Models.MyOpportunityVerification item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new MyOpportunityVerification
      {
        Id = item.Id,
        MyOpportunityId = item.MyOpportunityId,
        VerificationTypeId = item.VerificationTypeId,
        GeometryProperties = item.GeometryProperties,
        FileId = item.FileId,
        DateCreated = item.DateCreated,

      };

      _context.MyOpportunityVerifications.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<Domain.MyOpportunity.Models.MyOpportunityVerification> Update(Domain.MyOpportunity.Models.MyOpportunityVerification item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.MyOpportunity.Models.MyOpportunityVerification item)
    {
      var entity = _context.MyOpportunityVerifications.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(MyOpportunityVerification)} with id '{item.Id}' does not exist");
      _context.MyOpportunityVerifications.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}

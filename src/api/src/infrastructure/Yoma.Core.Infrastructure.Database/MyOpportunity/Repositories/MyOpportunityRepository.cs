using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories
{
    public class MyOpportunityRepository : BaseRepository<Entities.MyOpportunity>, IRepository<Domain.MyOpportunity.Models.MyOpportunity>
    {
        #region Constructor
        public MyOpportunityRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Domain.MyOpportunity.Models.MyOpportunity> Query()
        {
            return _context.MyOpportunity.Select(entity => new Domain.MyOpportunity.Models.MyOpportunity()
            {
                Id = entity.Id,
                UserId = entity.UserId,
                OpportunityId = entity.OpportunityId,
                ActionId = entity.ActionId,
                Action = Enum.Parse<Domain.MyOpportunity.Action>(entity.Action.Name, true),
                VerificationStatusId = entity.VerificationStatusId,
                VerificationStatus = entity.VerificationStatus != null ? Enum.Parse<VerificationStatus>(entity.VerificationStatus.Name, true) : null,
                CertificateId = entity.CertificateId,
                DateStart = entity.DateStart,
                DateEnd = entity.DateEnd,
                DateCompleted = entity.DateCompleted,
                ZltoReward = entity.ZltoReward,
                YomaReward = entity.YomaReward,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified,
            });
        }

        public async Task<Domain.MyOpportunity.Models.MyOpportunity> Create(Domain.MyOpportunity.Models.MyOpportunity item)
        {
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Entities.MyOpportunity
            {
                Id = item.Id,
                UserId = item.UserId,
                OpportunityId = item.OpportunityId,
                ActionId = item.ActionId,
                VerificationStatusId = item.VerificationStatusId,
                CertificateId = item.CertificateId,
                DateStart = item.DateStart,
                DateEnd = item.DateEnd,
                DateCompleted = item.DateCompleted,
                ZltoReward = item.ZltoReward,
                YomaReward = item.YomaReward,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified,
            };

            _context.MyOpportunity.Add(entity);

            await _context.SaveChangesAsync();
            item.Id = entity.Id;

            return item;
        }

        public async Task Update(Domain.MyOpportunity.Models.MyOpportunity item)
        {
            var entity = _context.MyOpportunity.Where(o => o.Id == item.Id).SingleOrDefault()
                ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.MyOpportunity)} with id '{item.Id}' does not exist");

            entity.ActionId = item.ActionId;
            entity.VerificationStatusId = item.VerificationStatusId;
            entity.CertificateId = item.CertificateId;
            entity.DateStart = item.DateStart;
            entity.DateEnd = item.DateEnd;
            entity.DateCompleted = item.DateCompleted;
            entity.ZltoReward = item.ZltoReward;
            entity.YomaReward = item.YomaReward;
            entity.DateModified = DateTimeOffset.Now;

            await _context.SaveChangesAsync();
        }

        public async Task Delete(Domain.MyOpportunity.Models.MyOpportunity item)
        {
            var entity = _context.MyOpportunity.Where(o => o.Id == item.Id).SingleOrDefault()
                ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.MyOpportunity)} with id '{item.Id}' does not exist");
            _context.MyOpportunity.Remove(entity);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}

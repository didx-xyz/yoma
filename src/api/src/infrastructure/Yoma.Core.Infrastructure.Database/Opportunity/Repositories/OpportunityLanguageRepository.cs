using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
    public class OpportunityLanguageRepository : BaseRepository<Entities.OpportunityLanguage>, IRepository<OpportunityLanguage>
    {
        #region Constructor
        public OpportunityLanguageRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<OpportunityLanguage> Query()
        {
            return _context.OpportunityLanguages.Select(entity => new OpportunityLanguage
            {
                Id = entity.Id,
                OpportunityId = entity.OpportunityId,
                LanguageId = entity.LanguageId,
                DateCreated = entity.DateCreated
            });
        }

        public async Task<OpportunityLanguage> Create(OpportunityLanguage item)
        {
            item.DateCreated = DateTimeOffset.Now;

            var entity = new Entities.OpportunityLanguage
            {
                Id = item.Id,
                OpportunityId = item.OpportunityId,
                LanguageId = item.LanguageId,
                DateCreated = item.DateCreated,

            };

            _context.OpportunityLanguages.Add(entity);
            await _context.SaveChangesAsync();
            item.Id = entity.Id;
            return item;
        }
        public Task Update(OpportunityLanguage item)
        {
            throw new NotImplementedException();
        }

        public async Task Delete(OpportunityLanguage item)
        {
            var entity = _context.OpportunityLanguages.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityLanguage)} with id '{item.Id}' does not exist");
            _context.OpportunityLanguages.Remove(entity);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}

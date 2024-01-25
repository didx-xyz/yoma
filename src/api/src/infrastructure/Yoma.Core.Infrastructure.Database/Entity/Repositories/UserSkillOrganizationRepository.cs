using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
    public class UserSkillOrganizationRepository : BaseRepository<UserSkillOrganization, Guid>, IRepository<Domain.Entity.Models.UserSkillOrganization>
    {
        #region Constructor
        public UserSkillOrganizationRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Domain.Entity.Models.UserSkillOrganization> Query()
        {
            return _context.UserSkillOrganizations.Select(entity => new Domain.Entity.Models.UserSkillOrganization
            {
                Id = entity.Id,
                UserSkillId = entity.UserSkillId,
                OrganizationId = entity.OrganizationId,
                DateCreated = entity.DateCreated
            });
        }

        public async Task<Domain.Entity.Models.UserSkillOrganization> Create(Domain.Entity.Models.UserSkillOrganization item)
        {
            item.DateCreated = DateTimeOffset.UtcNow;

            var entity = new UserSkillOrganization
            {
                Id = item.Id,
                UserSkillId = item.UserSkillId,
                OrganizationId = item.OrganizationId,
                DateCreated = item.DateCreated,

            };

            _context.UserSkillOrganizations.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public Task<Domain.Entity.Models.UserSkillOrganization> Update(Domain.Entity.Models.UserSkillOrganization item)
        {
            throw new NotImplementedException();
        }

        public async Task Delete(Domain.Entity.Models.UserSkillOrganization item)
        {
            var entity = _context.UserSkillOrganizations.Where(o => o.Id == item.Id).SingleOrDefault()
                ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(UserSkillOrganization)} with id '{item.Id}' does not exist");
            _context.UserSkillOrganizations.Remove(entity);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}

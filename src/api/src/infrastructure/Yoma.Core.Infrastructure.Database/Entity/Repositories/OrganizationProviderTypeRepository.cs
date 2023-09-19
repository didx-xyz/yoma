using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
    public class OrganizationProviderTypeRepository : BaseRepository<OrganizationProviderType>, IRepository<Domain.Entity.Models.OrganizationProviderType>
    {
        #region Constructor
        public OrganizationProviderTypeRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Domain.Entity.Models.OrganizationProviderType> Query()
        {
            return _context.OrganizationProviderTypes.Select(entity => new Domain.Entity.Models.OrganizationProviderType
            {
                Id = entity.Id,
                OrganizationId = entity.OrganizationId,
                ProviderTypeId = entity.ProviderTypeId,
                DateCreated = entity.DateCreated
            });
        }

        public async Task<Domain.Entity.Models.OrganizationProviderType> Create(Domain.Entity.Models.OrganizationProviderType item)
        {
            item.DateCreated = DateTimeOffset.Now;

            var entity = new OrganizationProviderType
            {
                Id = item.Id,
                OrganizationId = item.OrganizationId,
                ProviderTypeId = item.ProviderTypeId,
                DateCreated = item.DateCreated,
            };

            _context.OrganizationProviderTypes.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public Task<Domain.Entity.Models.OrganizationProviderType> Update(Domain.Entity.Models.OrganizationProviderType item)
        {
            throw new NotImplementedException();
        }

        public async Task Delete(Domain.Entity.Models.OrganizationProviderType item)
        {
            var entity = _context.OrganizationProviderTypes.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OrganizationProviderType)} with id '{item.Id}' does not exist");
            _context.OrganizationProviderTypes.Remove(entity);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}

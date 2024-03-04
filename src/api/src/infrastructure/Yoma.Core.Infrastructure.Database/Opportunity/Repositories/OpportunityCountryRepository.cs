using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
    public class OpportunityCountryRepository : BaseRepository<Entities.OpportunityCountry, Guid>, IRepository<OpportunityCountry>
    {
        #region Constructor
        public OpportunityCountryRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<OpportunityCountry> Query()
        {
            return _context.OpportunityCountries.Select(entity => new OpportunityCountry
            {
                Id = entity.Id,
                OpportunityId = entity.OpportunityId,
                OpportunityStatusId = entity.Opportunity.Status.Id,
                OpportunityDateStart = entity.Opportunity.DateStart,
                OrganizationStatusId = entity.Opportunity.Organization.Status.Id,
                CountryId = entity.CountryId,
                CountryName = entity.Country.Name,
                DateCreated = entity.DateCreated
            });
        }

        public async Task<OpportunityCountry> Create(OpportunityCountry item)
        {
            item.DateCreated = DateTimeOffset.UtcNow;

            var entity = new Entities.OpportunityCountry
            {
                Id = item.Id,
                OpportunityId = item.OpportunityId,
                CountryId = item.CountryId,
                DateCreated = item.DateCreated,

            };

            _context.OpportunityCountries.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }
        public Task<OpportunityCountry> Update(OpportunityCountry item)
        {
            throw new NotImplementedException();
        }

        public async Task Delete(OpportunityCountry item)
        {
            var entity = _context.OpportunityCountries.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityCountry)} with id '{item.Id}' does not exist");
            _context.OpportunityCountries.Remove(entity);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}

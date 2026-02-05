using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class ProgramCountryRepository : BaseRepository<Entities.ProgramCountry, Guid>, IRepository<ProgramCountry>
  {
    #region Constructor
    public ProgramCountryRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProgramCountry> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<ProgramCountry> Query()
    {
      return _context.ReferralProgramCountries.Select(entity => new ProgramCountry
      {
        Id = entity.Id,
        ProgramId = entity.ProgramId,
        ProgramStatusId = entity.Program.StatusId,
        ProgramDateStart = entity.Program.DateStart,
        CountryId = entity.CountryId,
        CountryName = entity.Country.Name,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<ProgramCountry> Create(ProgramCountry item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.ProgramCountry
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        CountryId = item.CountryId,
        DateCreated = item.DateCreated,
      };

      _context.ReferralProgramCountries.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<ProgramCountry> Update(ProgramCountry item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(ProgramCountry item)
    {
      var entity = _context.ReferralProgramCountries.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(ProgramCountry)} with id '{item.Id}' does not exist");
      _context.ReferralProgramCountries.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}

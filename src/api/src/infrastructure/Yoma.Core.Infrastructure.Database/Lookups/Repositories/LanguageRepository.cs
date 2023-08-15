using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class LanguageRepository : BaseRepository<Language>, IRepository<Domain.Lookups.Models.Language>
  {
    #region Constructor
    public LanguageRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.Language> Query()
    {
      return _context.Language.Select(entity => new Domain.Lookups.Models.Language
      {
        Id = entity.Id,
        Name = entity.Name,
        CodeAlpha2 = entity.CodeAlpha2,
      });
    }

    public Task<Domain.Lookups.Models.Language> Create(Domain.Lookups.Models.Language item)
    {
      throw new NotImplementedException();
    }

    public Task Update(Domain.Lookups.Models.Language item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.Language item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}

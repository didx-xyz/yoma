using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class OrganizationDocumentRepository : BaseRepository<OrganizationDocument, Guid>, IRepository<Domain.Entity.Models.OrganizationDocument>
  {
    #region Constructor
    public OrganizationDocumentRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.OrganizationDocument> Query()
    {
      return _context.OrganizationDocuments.Select(entity => new Domain.Entity.Models.OrganizationDocument
      {
        Id = entity.Id,
        OrganizationId = entity.OrganizationId,
        FileId = entity.FileId,
        Type = Enum.Parse<OrganizationDocumentType>(entity.Type, true),
        ContentType = entity.File.ContentType,
        OriginalFileName = entity.File.OriginalFileName,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.OrganizationDocument> Create(Domain.Entity.Models.OrganizationDocument item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new OrganizationDocument
      {
        Id = item.Id,
        OrganizationId = item.OrganizationId,
        FileId = item.FileId,
        Type = item.Type.ToString(),
        DateCreated = item.DateCreated,
      };

      _context.OrganizationDocuments.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<Domain.Entity.Models.OrganizationDocument> Update(Domain.Entity.Models.OrganizationDocument item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.Entity.Models.OrganizationDocument item)
    {
      var entity = _context.OrganizationDocuments.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"Document with id '{item.Id}' does not exist");
      _context.OrganizationDocuments.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}

using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IBlobService
  {
    BlobObject GetById(Guid id);

    Task<BlobObject> Create(IFormFile file, FileTypeEnum type);

    string GetURL(Guid id);

    Task Delete(Guid id);
  }
}

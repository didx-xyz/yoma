using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Validators;

namespace Yoma.Core.Domain.Core.Services
{
  public class BlobService : IBlobService
  {
    #region Class Variables
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly IBlobProviderClient _blobProviderClient;
    private readonly IRepository<BlobObject> _blobObjectRepository;
    #endregion

    #region Constructor
    public BlobService(IEnvironmentProvider environmentProvider, IBlobProviderClientFactory blobProviderClientFactory, IRepository<BlobObject> blobObjectRepository)
    {
      _environmentProvider = environmentProvider;
      _blobProviderClient = blobProviderClientFactory.CreateClient();
      _blobObjectRepository = blobObjectRepository;
    }
    #endregion

    #region Public Members
    public BlobObject GetById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _blobObjectRepository.Query().SingleOrDefault(o => o.Id == id);

      return result ?? throw new ArgumentOutOfRangeException(nameof(id), $"Blob with id '{id}' does not exist");
    }

    public async Task<BlobObject> Create(IFormFile file, FileTypeEnum type)
    {
      if (file == null)
        throw new ArgumentNullException(nameof(file));

      new FileValidator(type).Validate(file);

      var id = Guid.NewGuid();
      var key = $"{_environmentProvider.Environment}/{type}/{id}";

      var result = new BlobObject
      {
        Id = id,
        Key = key,
        DateCreated = DateTimeOffset.Now
      };

      using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

      await _blobObjectRepository.Create(result);
      await _blobProviderClient.Create(key, file.ContentType, file.ToBinary());

      scope.Complete();

      return result;
    }

    public string GetURL(Guid id)
    {
      var item = GetById(id);

      return _blobProviderClient.GetUrl(item.Key);
    }

    public async Task Delete(Guid id)
    {
      var item = GetById(id);

      using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

      await _blobObjectRepository.Delete(item);
      await _blobProviderClient.Delete(item.Key);

      scope.Complete();
    }
    #endregion
  }
}

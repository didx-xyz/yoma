using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
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
    private readonly IBlobProviderClientFactory _blobProviderClientFactory;
    private readonly IRepository<BlobObject> _blobObjectRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public BlobService(IEnvironmentProvider environmentProvider, IBlobProviderClientFactory blobProviderClientFactory, IRepository<BlobObject> blobObjectRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _environmentProvider = environmentProvider;
      _blobProviderClientFactory = blobProviderClientFactory;
      _blobObjectRepository = blobObjectRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public BlobObject GetById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _blobObjectRepository.Query().SingleOrDefault(o => o.Id == id);

      return result ?? throw new EntityNotFoundException($"Blob with id '{id}' does not exist");
    }

    // Create the blob object only, preserving the tracking record; used for rollbacks
    public async Task<BlobObject> Create(Guid id, IFormFile file)
    {
      var result = GetById(id);

      ArgumentNullException.ThrowIfNull(file, nameof(file));

      new FileValidator(result.FileType).Validate(file);

      var client = _blobProviderClientFactory.CreateClient(result.StorageType);

      await client.Create(result.Key, file.ContentType, file.ToBinary());

      return result;
    }

    public async Task<BlobObject> Create(IFormFile file, FileType type, StorageType storageType)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));

      new FileValidator(type).Validate(file);

      var id = Guid.NewGuid();
      var key = $"{_environmentProvider.Environment}/{type}/{id}{file.GetExtension()}";

      var result = new BlobObject
      {
        Id = id,
        StorageType = storageType,
        FileType = type,
        Key = key,
        ContentType = file.ContentType,
        OriginalFileName = file.FileName
      };

      var client = _blobProviderClientFactory.CreateClient(storageType);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        result = await _blobObjectRepository.Create(result);

        if (TempFileTracker.TryGetTempPath(file, out var tempPath) && !string.IsNullOrEmpty(tempPath))
          await client.CreateFromFile(key, file.ContentType, tempPath);
        else
          await client.Create(key, file.ContentType, file.ToBinary());

        scope.Complete();
      });

      return result;
    }

    public async Task<IFormFile> Download(Guid id)
    {
      var item = GetById(id);

      var client = _blobProviderClientFactory.CreateClient(item.StorageType);

      var (contentType, data) = await client.Download(item.Key);

      return FileHelper.FromByteArray(item.OriginalFileName, contentType, data);
    }

    public async Task<(string OriginalFileName, string ContentType, string TempSourceFile)> DownloadRawToFile(Guid id)
    {
      var item = GetById(id);

      var client = _blobProviderClientFactory.CreateClient(item.StorageType);

      var (contentType, tempSourceFile) = await client.DownloadToFile(item.Key);

      return (item.OriginalFileName, contentType, tempSourceFile);
    }

    public string GetURL(Guid id, string? fileName = null, int? urlExpirationInMinutes = null)
    {
      var item = GetById(id);

      var client = _blobProviderClientFactory.CreateClient(item.StorageType);

      return client.GetUrl(item.Key, fileName, urlExpirationInMinutes);
    }

    public string GetURL(StorageType storageType, string key, string? fileName = null, int? urlExpirationInMinutes = null)
    {
      var client = _blobProviderClientFactory.CreateClient(storageType);

      return client.GetUrl(key, fileName, urlExpirationInMinutes);
    }

    public async Task Delete(Guid id)
    {
      var item = GetById(id);

      var client = _blobProviderClientFactory.CreateClient(item.StorageType);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        await _blobObjectRepository.Delete(item);
        await client.Delete(item.Key);

        scope.Complete();
      });
    }

    // Delete the blob object only; used for rollbacks
    public async Task Delete(BlobObject blobObject)
    {
      ArgumentNullException.ThrowIfNull(blobObject, nameof(blobObject));

      var client = _blobProviderClientFactory.CreateClient(blobObject.StorageType);

      await client.Delete(blobObject.Key);
    }

    public async Task Archive(Guid id, BlobObject blobObjectReplacement)
    {
      var item = GetById(id);

      ArgumentNullException.ThrowIfNull(blobObjectReplacement, nameof(blobObjectReplacement));

      item.ParentId = blobObjectReplacement.Id;
      await _blobObjectRepository.Update(item);
    }
    #endregion
  }
}

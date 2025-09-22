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
    private readonly IResumableUploadStore _resumableUploadStore;
    #endregion

    #region Constructor
    public BlobService(IEnvironmentProvider environmentProvider,
      IBlobProviderClientFactory blobProviderClientFactory,
      IRepository<BlobObject> blobObjectRepository,
      IExecutionStrategyService executionStrategyService,
      IResumableUploadStore resumableUploadStore)
    {
      _environmentProvider = environmentProvider;
      _blobProviderClientFactory = blobProviderClientFactory;
      _blobObjectRepository = blobObjectRepository;
      _executionStrategyService = executionStrategyService;
      _resumableUploadStore = resumableUploadStore;
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

      FileValidator.Validate(result.FileType, file);

      var client = _blobProviderClientFactory.CreateClient(result.StorageType);

      await client.Create(result.Key, file.ContentType, file.ToBinary());

      return result;
    }

    public async Task<BlobObject> Create(FileType type, StorageType storageType, IFormFile? file, string? uploadId)
    {
      uploadId = uploadId?.Trim();

      if (file != null && !string.IsNullOrEmpty(uploadId))
        throw new InvalidOperationException("Both the file and pre-uploaded ID were provided");

      if (file != null) return await Create(type, storageType, file);
      if (!string.IsNullOrEmpty(uploadId)) return await Create(type, storageType, uploadId);

      throw new InvalidOperationException("Either upload the file or specify the pre-uploaded ID");
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

    #region Private Members
    private async Task<BlobObject> Create(FileType type, StorageType storageType, IFormFile file)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));

      FileValidator.Validate(type, file);

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

    private async Task<BlobObject> Create(FileType type, StorageType storageType, string uploadId)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(uploadId);
      uploadId = uploadId.Trim();

      var info = await _resumableUploadStore.GetInfo(uploadId);

      FileValidator.Validate(info.OriginalFileName, info.Length);

      var id = Guid.NewGuid();
      var key = $"{_environmentProvider.Environment}/{type}/{id}{info.Extension}";

      var result = new BlobObject
      {
        Id = id,
        StorageType = storageType,
        FileType = type,
        Key = key,
        ContentType = info.ContentType,
        OriginalFileName = info.OriginalFileName
      };

      var client = _blobProviderClientFactory.CreateClient(storageType);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        result = await _blobObjectRepository.Create(result);

        await client.Create(key, info.ContentType, info.SourceBucket, info.SourceKey);

        scope.Complete();
      });

      return result;
    }
    #endregion
  }
}

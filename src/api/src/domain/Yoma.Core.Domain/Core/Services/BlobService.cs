using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider.Extensions;
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
        #endregion

        #region Constructor
        public BlobService(IEnvironmentProvider environmentProvider, IBlobProviderClientFactory blobProviderClientFactory, IRepository<BlobObject> blobObjectRepository)
        {
            _environmentProvider = environmentProvider;
            _blobProviderClientFactory = blobProviderClientFactory;
            _blobObjectRepository = blobObjectRepository;
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

            if (file == null)
                throw new ArgumentNullException(nameof(file));

            new FileValidator(result.FileType).Validate(file);

            var client = _blobProviderClientFactory.CreateClient(result.StorageType);

            await client.Create(result.Key, file.ContentType, file.ToBinary());

            return result;
        }

        public async Task<BlobObject> Create(IFormFile file, FileType type)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            new FileValidator(type).Validate(file);

            var id = Guid.NewGuid();
            var key = $"{_environmentProvider.Environment}/{type}/{id}{file.GetExtension()}";
            var storageType = type.ToStorageType();

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

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

            result = await _blobObjectRepository.Create(result);
            await client.Create(key, file.ContentType, file.ToBinary());

            scope.Complete();

            return result;
        }

        public async Task<IFormFile> Download(Guid id)
        {
            var item = GetById(id);

            var client = _blobProviderClientFactory.CreateClient(item.StorageType);

            var (ContentType, Data) = await client.Download(item.Key);

            return FileHelper.FromByteArray(item.OriginalFileName, ContentType, Data);
        }

        public string GetURL(Guid id)
        {
            var item = GetById(id);

            var client = _blobProviderClientFactory.CreateClient(item.StorageType);

            return client.GetUrl(item.Key);
        }

        public async Task Delete(Guid id)
        {
            var item = GetById(id);

            var client = _blobProviderClientFactory.CreateClient(item.StorageType);

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

            await _blobObjectRepository.Delete(item);
            await client.Delete(item.Key);

            scope.Complete();
        }

        // Delete the blob object only; used for rollbacks
        public async Task Delete(BlobObject blobObject)
        {
            if (blobObject == null)
                throw new ArgumentNullException(nameof(blobObject));

            var client = _blobProviderClientFactory.CreateClient(blobObject.StorageType);

            await client.Delete(blobObject.Key);
        }
        #endregion
    }
}
